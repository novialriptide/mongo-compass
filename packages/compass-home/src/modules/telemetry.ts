import { type DataService, configuredKMSProviders } from 'mongodb-data-service';
import type { ConnectionInfo } from '@mongodb-js/connection-storage/renderer';
import { type LoggerAndTelemetry } from '@mongodb-js/compass-logging/provider';
import { isLocalhost, isDigitalOcean, isAtlas } from 'mongodb-build-info';
import { getCloudInfo } from 'mongodb-cloud-info';
import ConnectionString from 'mongodb-connection-string-url';
import type { MongoServerError, MongoClientOptions } from 'mongodb';
import resolveMongodbSrv from 'resolve-mongodb-srv';

type HostInformation = {
  is_localhost: boolean;
  is_atlas_url: boolean;
  is_do_url: boolean;
  is_public_cloud?: boolean;
  public_cloud_name?: string;
};

async function getPublicCloudInfo(host: string): Promise<{
  public_cloud_name?: string;
  is_public_cloud?: boolean;
}> {
  try {
    const { isAws, isAzure, isGcp } = await getCloudInfo(host);

    const public_cloud_name = isAws
      ? 'AWS'
      : isAzure
      ? 'Azure'
      : isGcp
      ? 'GCP'
      : undefined;

    if (public_cloud_name === undefined) {
      return { is_public_cloud: false };
    }

    return {
      is_public_cloud: true,
      public_cloud_name,
    };
  } catch (err) {
    return {};
  }
}

async function getHostInformation(
  host: string | null
): Promise<HostInformation> {
  if (!host) {
    return {
      is_do_url: false,
      is_atlas_url: false,
      is_localhost: false,
    };
  }

  if (isLocalhost(host)) {
    return {
      is_public_cloud: false,
      is_do_url: false,
      is_atlas_url: false,
      is_localhost: true,
    };
  }

  if (isDigitalOcean(host)) {
    return {
      is_localhost: false,
      is_public_cloud: false,
      is_atlas_url: false,
      is_do_url: true,
    };
  }

  const publicCloudInfo = await getPublicCloudInfo(host);

  return {
    is_localhost: false,
    is_do_url: false,
    is_atlas_url: isAtlas(host),
    ...publicCloudInfo,
  };
}

function getCsfleInformation(
  fleOptions: ConnectionInfo['connectionOptions']['fleOptions']
): Record<string, unknown> {
  const kmsProviders = configuredKMSProviders(fleOptions?.autoEncryption ?? {});
  const csfleInfo: Record<string, unknown> = {
    is_csfle: kmsProviders.length > 0,
    has_csfle_schema: !!fleOptions?.autoEncryption?.encryptedFieldsMap,
  };

  for (const kmsProvider of ['aws', 'gcp', 'kmip', 'local', 'azure'] as const) {
    csfleInfo[`has_kms_${kmsProvider}`] =
      !!fleOptions?.autoEncryption?.kmsProviders?.[kmsProvider];
  }

  return csfleInfo;
}

async function getHostnameForConnection(
  connectionStringData: ConnectionString
): Promise<string | null> {
  if (connectionStringData.isSRV) {
    const uri = await resolveMongodbSrv(connectionStringData.toString()).catch(
      () => {
        return null;
      }
    );
    if (!uri) {
      return null;
    }
    connectionStringData = new ConnectionString(uri, {
      looseValidation: true,
    });
  }

  return connectionStringData.hosts[0];
}

async function getConnectionData({
  connectionOptions: { connectionString, sshTunnel, fleOptions },
}: Pick<ConnectionInfo, 'connectionOptions'>): Promise<
  Record<string, unknown>
> {
  const connectionStringData = new ConnectionString(connectionString, {
    looseValidation: true,
  });
  const searchParams =
    connectionStringData.typedSearchParams<MongoClientOptions>();

  const authMechanism = searchParams.get('authMechanism');
  const authType = authMechanism
    ? authMechanism
    : connectionStringData.username
    ? 'DEFAULT'
    : 'NONE';
  const proxyHost = searchParams.get('proxyHost');

  const resolvedHostname = await getHostnameForConnection(connectionStringData);

  return {
    ...(await getHostInformation(resolvedHostname)),
    auth_type: authType.toUpperCase(),
    tunnel: proxyHost ? 'socks5' : sshTunnel ? 'ssh' : 'none',
    is_srv: connectionStringData.isSRV,
    ...getCsfleInformation(fleOptions),
  };
}

export function trackConnectionAttemptEvent(
  { favorite, lastUsed }: Pick<ConnectionInfo, 'favorite' | 'lastUsed'>,
  { track, debug }: LoggerAndTelemetry
): void {
  try {
    const trackEvent = {
      is_favorite: Boolean(favorite),
      is_recent: Boolean(lastUsed && !favorite),
      is_new: !lastUsed,
    };
    track('Connection Attempt', trackEvent);
  } catch (error) {
    debug('trackConnectionAttemptEvent failed', error);
  }
}

export function trackNewConnectionEvent(
  connectionInfo: Pick<ConnectionInfo, 'connectionOptions'>,
  dataService: Pick<DataService, 'instance' | 'getCurrentTopologyType'>,
  { track, debug }: LoggerAndTelemetry
): void {
  try {
    const callback = async () => {
      const { dataLake, genuineMongoDB, host, build, isAtlas, isLocalAtlas } =
        await dataService.instance();
      const connectionData = await getConnectionData(connectionInfo);
      const trackEvent = {
        ...connectionData,
        is_atlas: isAtlas,
        is_local_atlas: isLocalAtlas,
        is_dataLake: dataLake.isDataLake,
        is_enterprise: build.isEnterprise,
        is_genuine: genuineMongoDB.isGenuine,
        non_genuine_server_name: genuineMongoDB.dbType,
        server_version: build.version,
        server_arch: host.arch,
        server_os_family: host.os_family,
        topology_type: dataService.getCurrentTopologyType(),
      };
      return trackEvent;
    };
    track('New Connection', callback);
  } catch (error) {
    debug('trackNewConnectionEvent failed', error);
  }
}

export function trackConnectionFailedEvent(
  connectionInfo: Pick<ConnectionInfo, 'connectionOptions'> | null,
  connectionError: Error & Partial<Pick<MongoServerError, 'code' | 'codeName'>>,
  { track, debug }: LoggerAndTelemetry
): void {
  try {
    const callback = async () => {
      const connectionData =
        connectionInfo !== null ? await getConnectionData(connectionInfo) : {};
      const trackEvent = {
        ...connectionData,
        error_code: connectionError.code,
        error_name: connectionError.codeName ?? connectionError.name,
      };
      return trackEvent;
    };
    track('Connection Failed', callback);
  } catch (error) {
    debug('trackConnectionFailedEvent failed', error);
  }
}
