'use strict';

var assert = require('assert');
var path = require('path');
var fs = require('fs');

var File = require('../lib/file').File;
var Header = require('../lib/file/header').Header;
var Track = require('../lib/file/track').Track;
var MetaEvent = require('../lib/file/event').MetaEvent;
var ChannelEvent = require('../lib/file/event').ChannelEvent;

var fixtures = path.join(__dirname, 'fixtures');
var filePath = path.join(fixtures, 'file.mid');
var invalidFilePath = path.join(fixtures, 'invalid-file.mid');

describe('File as a reader', function () {
    describe('loading APIs', function () {
        var bufferFile, streamFile;
        
        it('should load with buffers', function (done) {
            fs.readFile(filePath, function (err, data) {
                if (err) {
                    throw err;
                }

                bufferFile = new File(data);
                bufferFile.parse(done);
            });
        });
        
        it('should load with streams', function (done) {
            streamFile = new File();
            streamFile.on('parsed', done);

            fs.createReadStream(filePath).pipe(streamFile);
        });
        
        it('should give the same results', function () {
            assert.deepEqual(bufferFile.header, streamFile.header);
            assert.deepEqual(bufferFile.tracks, streamFile.tracks);
        });
    });
    
    describe('file compliance', function () {
        var file;
        
        before(function (done) {
            file = new File();
            file.on('parsed', done);

            fs.createReadStream(filePath).pipe(file);
        });
        
        it('should parse header to correct structure', function () {
            assert.strictEqual(typeof file.header.fileType, 'number');
            assert.strictEqual(typeof file.header.ticksPerBeat, 'number');
            assert.strictEqual(typeof file.header.trackCount, 'number');
        });
        
        it('should parse tracks to correct structure', function () {
            assert.ok(Array.isArray(file.tracks));
            assert.strictEqual(file.tracks.length, file.header.trackCount);
        });
        
        it('should parse header with correct data', function () {
            var header = new Header(1, 2, 480);
            assert.deepEqual(file.header, header);
        });
        
        it('should parse tracks with correct data', function () {
            var tracks = [
                new Track(
                    new MetaEvent('instrumentName', {
                        text: ''
                    }),
                    new MetaEvent('setTempo', {
                        tempo: 120
                    }),
                    new MetaEvent('sequenceName', {
                        text: 'Sequence Name'
                    }),
                    new MetaEvent('endOfTrack')
                ),
                new Track(
                    new MetaEvent('instrumentName', {
                        text: 'Acoustic Grand Piano'
                    }),
                    new MetaEvent('sequenceName', {
                        text: 'My New Track'
                    }),
                    new ChannelEvent('controller', 0, {
                        controller: 7,
                        value: 127
                    }),
                    new ChannelEvent('programChange', 0, {
                        program: 1
                    }),
                    new ChannelEvent('noteOn', 0, {
                        note: 64,
                        velocity: 127
                    }),
                    new ChannelEvent('noteOff', 0, {
                        note: 64,
                        velocity: 127
                    }, 480),
                    new ChannelEvent('noteOn', 0, {
                        note: 66,
                        velocity: 127
                    }),
                    new ChannelEvent('noteOff', 0, {
                        note: 66,
                        velocity: 127
                    }, 480),
                    new ChannelEvent('noteOn', 0, {
                        note: 68,
                        velocity: 127
                    }),
                    new ChannelEvent('noteOff', 0, {
                        note: 68,
                        velocity: 127
                    }, 480),
                    new ChannelEvent('noteOn', 0, {
                        note: 69,
                        velocity: 127
                    }),
                    new ChannelEvent('noteOff', 0, {
                        note: 69,
                        velocity: 127
                    }, 480),
                    new ChannelEvent('noteOn', 0, {
                        note: 71,
                        velocity: 127
                    }),
                    new ChannelEvent('noteOff', 0, {
                        note: 71,
                        velocity: 127
                    }, 480),
                    new ChannelEvent('noteOn', 0, {
                        note: 73,
                        velocity: 127
                    }),
                    new ChannelEvent('noteOff', 0, {
                        note: 73,
                        velocity: 127
                    }, 480),
                    new ChannelEvent('noteOn', 0, {
                        note: 75,
                        velocity: 127
                    }),
                    new ChannelEvent('noteOff', 0, {
                        note: 75,
                        velocity: 127
                    }, 480),
                    new ChannelEvent('noteOn', 0, {
                        note: 76,
                        velocity: 127
                    }),
                    new ChannelEvent('noteOff', 0, {
                        note: 76,
                        velocity: 127
                    }, 480),
                    new MetaEvent('endOfTrack')
                )
            ];
            
            file.tracks.forEach(function (track, i) {
                track.events.forEach(function (event, j) {
                    assert.deepEqual(event, tracks[i].events[j]);
                });
            });
        });
    });
    
    describe('invalid files', function () {
        it('should throw when parsing invalid files', function (done) {
            var file;
            
            fs.readFile(invalidFilePath, function (err, data) {
                if (err) {
                    throw err;
                }
                
                file = new File(data);
                
                file.on('error', function (error) {
                    assert.ok(/invalid midi/i.test(error.message));
                    done();
                });
                
                file.parse();
            });
        });
    });
});