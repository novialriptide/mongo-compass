/* eslint no-unused-expressions: 0 */
const expect = require('chai').expect;
const mock = require('mock-require');
let FieldStore = require('../../src/internal-packages/app/lib/stores/field-store');
let schemaFixture = require('../fixtures/array_of_docs.fixture.json');

describe('FieldStore', function() {
  let unsubscribe;

  beforeEach(() => {
    unsubscribe = () => {};
    FieldStore = mock.reRequire('../../src/internal-packages/app/lib/stores/field-store');
  });

  afterEach(() => {
    unsubscribe();
  });

  it('has an initial state', () => {
    const state = FieldStore.getInitialState();
    expect(state).to.have.all.keys(['fields', 'topLevelFields']);
    expect(state.fields).to.be.empty;
    expect(state.topLevelFields).to.be.empty;
  });

  it('samples a single document', (done) => {
    const doc = {harry: 1, potter: true};
    unsubscribe = FieldStore.listen((state) => {
      expect(Object.keys(state.fields)).to.have.all.members(['harry', 'potter']);
      done();
    });
    FieldStore.processSingleDocument(doc);
  });

  it('samples many documents', (done) => {
    const docs = [{harry: 1, potter: true}, {ron: 'test', weasley: null}];
    unsubscribe = FieldStore.listen((state) => {
      expect(Object.keys(state.fields)).to.have.all.members([
        'harry', 'potter', 'ron', 'weasley']);
      done();
    });
    FieldStore.processDocuments(docs);
  });

  it('merges new docs with the existing state', (done) => {
    const doc = {harry: 1, potter: true};
    FieldStore.processSingleDocument(doc);
    setTimeout(() => {
      const secondDoc = {hermione: 0, granger: false};
      unsubscribe = FieldStore.listen((state) => {
        expect(Object.keys(state.fields)).to.have.all.members([
          'harry', 'potter', 'hermione', 'granger']);
        done();
      });
      FieldStore.processSingleDocument(secondDoc);
    });
  });

  it('merges a schema with the existing state', (done) => {
    const doc = {harry: 1, potter: true};
    FieldStore.processSingleDocument(doc);
    setTimeout(() => {
      unsubscribe = FieldStore.listen((state) => {
        expect(Object.keys(state.fields)).to.have.all.members(['harry', 'potter',
          '_id', 'review', 'review._id', 'review.rating', 'review.text',
          'reviews', 'reviews._id', 'reviews.rating', 'reviews.text']);
        done();
      });
      FieldStore.processSchema(schemaFixture);
    });
  });

  it('flattens the schema', function(done) {
    unsubscribe = FieldStore.listen((state) => {
      expect(state.fields).to.have.all.keys(['a', 'a.b', 'a.b.c']);
      unsubscribe();
      done();
    });
    FieldStore.processSingleDocument({a: {b: {c: 1}}});
  });

  it('maintains list of root fields', function(done) {
    unsubscribe = FieldStore.listen((state) => {
      expect(state.topLevelFields).to.have.all.members(['a', 'd', 'e']);
      unsubscribe();
      done();
    });
    FieldStore.processSingleDocument({a: {b: {c: 1}}, d: 5, e: {f: 3}});
  });

  context('collisions of name/path/count/type within a single document', () => {
    it('handles name', (done) => {
      const expected = {
        'foo1': {
          'count': 1,
          'name': 'foo1',
          'nestedFields': [
            'foo1.age',
            'foo1.name'
          ],
          'path': 'foo1',
          'type': 'Array'
        },
        'foo1.age': {
          'count': 1,
          'name': 'age',
          'path': 'foo1.age',
          'type': 'Number'
        },
        // The following was a string, not a field
        'foo1.name': {
          'count': 1,
          'name': 'name',
          'path': 'foo1.name',
          'type': 'String'
        }
      };
      const doc = {
        foo1: [{age: 10, name: 'bazillion'}]
      };
      unsubscribe = FieldStore.listen((state) => {
        expect(state.fields).to.be.deep.equal(expected);
        done();
      });
      FieldStore.processSingleDocument(doc);
    });
    it('handles path', (done) => {
      const expected = {
        'foo1': {
          'count': 1,
          'name': 'foo1',
          'nestedFields': [
            'foo1.age',
            'foo1.path'
          ],
          'path': 'foo1',
          'type': 'Array'
        },
        'foo1.age': {
          'count': 1,
          'name': 'age',
          'path': 'foo1.age',
          'type': 'Number'
        },
        // The following was a string, not a field
        'foo1.path': {
          'count': 1,
          'name': 'path',
          'path': 'foo1.path',
          'type': 'String'
        }
      };
      const doc = {
        foo1: [{age: 10, path: 'bazillion'}]
      };
      unsubscribe = FieldStore.listen((state) => {
        expect(state.fields).to.be.deep.equal(expected);
        done();
      });
      FieldStore.processSingleDocument(doc);
    });
  });
});
