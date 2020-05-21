process.env.TESTING = true;
process.env.SERVER_PORT=2000;
process.env.LOCALCHAIN_URL="http://localhost:8545";

const assert = require('assert');
const chai = require('chai');
const chaiHttp = require('chai-http');
const ganache = require('ganache-cli');
const exec = require('child_process').execSync;
const pify = require('pify');
const Web3 = require('web3');
const read = require('fs').readFileSync;
const util = require('util');
const path = require('path');

const app = require('../src/server').default;
const { deployFromArtifact } = require('./helpers/helpers');

const Simple = require('./sources/pass/simple.js');
const simpleMetadataPath = './test/sources/all/simple.meta.json';
const simpleSourcePath = './test/sources/all/Simple.sol';
const simpleMetadataJSONPath = './test/sources/metadata/simple.meta.object.json';

chai.use(chaiHttp);

describe("server", function() {
  this.timeout(15000);

  let server;
  let web3;
  let simpleInstance;
  let repo = 'repository';
  let serverAddress = 'http://localhost:2000';

  before(async function(){
    server = ganache.server();
    await pify(server.listen)(8545);
    web3 = new Web3(process.env.LOCALCHAIN_URL);

    simpleInstance = await deployFromArtifact(web3, Simple);
  });

  // Clean up repository
  afterEach(function(){
    try { exec(`rm -rf ${repo}`) } catch(err) { /*ignore*/ }
  })

  // Clean up server
  after(async function(){
    await pify(server.close)();
  });

  it("when submitting a valid request (stringified metadata)", function(done){
    const expectedPath = path.join(
      './repository',
      'contract',
      'localhost',
      simpleInstance.options.address,
      'metadata.json'
    );

    const submittedMetadata = read(simpleMetadataPath, 'utf-8');

    chai.request(serverAddress)
      .post('/')
      .attach("files", read(simpleMetadataPath), "simple.meta.json")
      .attach("files", read(simpleSourcePath), "Simple.sol")
      .field("address", simpleInstance.options.address)
      .field("chain", 'localhost')
      .end(function (err, res) {
        assert.equal(err, null);
        assert.equal(res.status, 200);

        // Verify sources were written to repo
        const saved = JSON.stringify(read(expectedPath, 'utf-8'));
        assert.equal(saved, submittedMetadata.trim());
        done();
      });
  });

  it("when submitting a valid request (json formatted metadata)", function(done){
    const expectedPath = path.join(
      './repository',
      'contract',
      'localhost',
      simpleInstance.options.address,
      'metadata.json'
    );

    // The injector will save a stringified version
    const stringifiedMetadata = read(simpleMetadataPath, 'utf-8');

    chai.request(serverAddress)
      .post('/')
      .attach("files", read(simpleMetadataJSONPath), "simple.meta.object.json")
      .attach("files", read(simpleSourcePath), "Simple.sol")
      .field("address", simpleInstance.options.address)
      .field("chain", 'localhost')
      .end(function (err, res) {
        assert.equal(err, null);
        assert.equal(res.status, 200);

        // Verify sources were written to repo
        const saved = JSON.stringify(read(expectedPath, 'utf-8'));
        assert.equal(saved, stringifiedMetadata.trim());
        done();
      });
  });

  it("when submitting a single metadata file (error)", function(done){
    chai.request(serverAddress)
      .post('/')
      .attach("files", read(simpleMetadataPath), "simple.meta.json")
      .field("address", simpleInstance.options.address)
      .field("chain", 'localhost')
      .end(function (err, res) {
        assert.equal(err, null);
        assert.equal(res.status, 500);
        assert(res.error.text.includes('metadata file mentions a source file'));
        assert(res.error.text.includes('cannot be found in your upload'));
        done();
      });
  });

  it("when submitting a single source file (error)", function(done){
    chai.request(serverAddress)
      .post('/')
      .attach("files", read(simpleSourcePath), "Simple.sol")
      .field("address", simpleInstance.options.address)
      .field("chain", 'localhost')
      .end(function (err, res) {
        assert.equal(err, null);
        assert.equal(res.status, 500);
        assert(res.error.text.includes('Metadata file not found'));
        done();
      });
  });

  it("when submitting without attaching files (error)", function(done){
    chai.request(serverAddress)
      .post('/')
      .field("address", simpleInstance.options.address)
      .field("chain", 'localhost')
      .end(function (err, res) {
        assert.equal(err, null);
        assert.equal(res.status, 401);
        assert(res.error.text.includes('Request missing expected property'));
        assert(res.error.text.includes('req.files.files'));
        done();
      });
  })

  it("when submitting without an address (error)", function(done){
    chai.request(serverAddress)
      .post('/')
      .attach("files", read(simpleMetadataPath), "simple.meta.json")
      .attach("files", read(simpleSourcePath), "Simple.sol")
      .field("chain", 'localhost')
      .end(function (err, res) {
        assert.equal(err, null);
        assert.equal(res.status, 500);
        assert(res.error.text.includes('Missing address'));
        done();
      });
  });

  it("when submitting without a chain name (error)", function(done){
    chai.request(serverAddress)
      .post('/')
      .attach("files", read(simpleMetadataPath), "simple.meta.json")
      .attach("files", read(simpleSourcePath), "Simple.sol")
      .field("address", simpleInstance.options.address)
      .end(function (err, res) {
        assert.equal(err, null);
        assert.equal(res.status, 500);
        assert(res.error.text.includes('Missing chain name'));
        done();
      });
  });

  it("get /health", function(done){
    chai.request(serverAddress)
      .get('/health')
      .end(function (err, res) {
        assert.equal(err, null);
        assert.equal(res.status, 200);
        assert(res.text.includes('Alive and kicking!'))
        done();
      });
  });
});
