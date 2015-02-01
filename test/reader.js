/*jslint node:true, browser:true, nomen:true */
/*globals before, describe, after, it */

'use strict';

var assert = require('assert');
var util = require('util');
var fs = require('fs');

var Reader = require('../lib/parser/reader').Reader;

var filesPath = __dirname + '/files/';
var pathFormat = filesPath + '%d_%d_time.mid';
var times = [
    [3, 4, true],  [4, 4, true],  [6, 8, true],  [9, 8, true],  [12, 8, true],
    [3, 4, false], [4, 4, false], [6, 8, false], [9, 8, false], [12, 8, false]
];

describe('Reader', function () {
    times.forEach(function (time) {
        var path = util.format(pathFormat, time[0], time[1]), midi,
            streamMessage = (time[2]) ? 'read with streams' : 'read with buffers',
            message = util.format('file %s (%s)', path, streamMessage);
        
        describe(message, function () {
            before(function (done) {
                if (time[2]) {
                    midi = new Reader();
                    midi.on('parsed', done);
                    
                    fs.createReadStream(path).pipe(midi);
                } else {
                    fs.readFile(path, function (err, data) {
                        if (err) {
                            throw err;
                        }

                        midi = new Reader(data);
                        midi.parse(done);
                    });
                }
            });

            it('should parse the header chunk', function () {
                assert.strictEqual(midi.header.type, 'MThd');
                assert.strictEqual(midi.header.length, 6);

                assert.strictEqual(typeof midi.header.fileType, 'number');
                assert.ok(midi.header.fileType >= 0);
                assert.ok(midi.header.fileType <= 2);

                assert.strictEqual(typeof midi.header.trackCount, 'number');
                assert.ok(midi.header.trackCount > 0, 'number');

                assert.strictEqual(typeof midi.header.ticksPerBeat, 'number');
                assert.ok(midi.header.ticksPerBeat > 0);
            });

            it('should parse the tracks chunks as a list of tracks', function () {
                assert.ok(Array.isArray(midi.tracks));
                assert.strictEqual(midi.tracks.length, midi.header.trackCount);
            });

            it('should parse each track chunk', function () {
                var types, channelSubtypes, metaSubtypes;

                types = ['channel', 'sysex', 'meta'];
                channelSubtypes = ['noteOff', 'noteOn', 'noteAftertouch',
                                   'controller', 'programChange',
                                   'channelAftertouch', 'pitchBend'];
                metaSubtypes = ['sequenceNumber', 'text', 'copyrightNotice',
                                'sequenceName', 'instumentName', 'lyrics',
                                'marker', 'cuePoint', 'channelPrefix',
                                'endOfTrack', 'setTempo', 'timeSignature',
                                'keySignature', 'sequencerSpecific'];

                midi.tracks.forEach(function (track) {
                    assert.strictEqual(track.type, 'MTrk');
                    assert.ok(Array.isArray(track.events));

                    track.events.forEach(function (event, index) {
                        assert.strictEqual(typeof event.type, 'string');
                        assert.notStrictEqual(types.indexOf(event.type), -1);
                        assert.strictEqual(typeof event.delay, 'number');

                        if (index === track.events.length - 1) {
                            assert.strictEqual(event.type, 'meta');
                            assert.strictEqual(event.subtype, 'endOfTrack');
                            return;
                        }

                        switch (event.type) {
                        case 'channel':
                            assert.strictEqual(typeof event.channel, 'number');
                            assert.ok(event.channel >= 0);
                            assert.ok(event.channel <= 15);

                            assert.notStrictEqual(
                                channelSubtypes.indexOf(event.subtype),
                                -1
                            );

                            break;
                        case 'meta':
                            assert.notStrictEqual(
                                metaSubtypes.indexOf(event.subtype),
                                -1
                            );

                            switch (event.subtype) {
                            case 'timeSignature':
                                assert.strictEqual(event.numerator, time[0]);
                                assert.strictEqual(event.denominator, time[1]);
                                assert.strictEqual(typeof event.metronome, 'number');
                                assert.strictEqual(event.clockSignalsPerBeat, 24);
                                break;

                            case 'keySignature':
                                assert.ok(event.major);
                                assert.strictEqual(event.note, 0);
                                break;

                            case 'setTempo':
                                assert.strictEqual(event.tempo, 600000);
                                break;
                            }
                            break;
                        }
                    });
                });
            });
        });
    });
    
    describe('invalid file "' + filesPath + 'invalid_file.mid"', function () {
        var path = filesPath + 'invalid_file.mid', midi;

        it('should throw on parsing the file', function (done) {
            fs.readFile(path, function (err, data) {
                if (err) {
                    throw err;
                }
                
                midi = new Reader(data);
                
                midi.on('error', function (error) {
                    assert.ok(/invalid midi/i.test(error.message));
                    done();
                });
                
                midi.parse();
            });
        });
    });
});