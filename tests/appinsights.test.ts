import events = require("events");

import assert = require("assert");
import sinon = require("sinon");

import appinsights = require("../lib/appinsights");

class MockAppInsightsBackend extends appinsights {
    public constructor(config: any) {
        super(config);
    }
    public getAppInsights() {
        return this.appInsights;
    }
    public init(events: any) {
        return super.init(events);
    }
    public onFlush(timestamp: string, metrics: any) {
        return super.onFlush(timestamp, metrics);
    }
    public shouldProcess(key: string): boolean {
        return super.shouldProcess(key);
    }
    public parseKey(key: string) {
        return super.parseKey(key);
    }
}

describe("Test appinsights statsd backend", () => {
    const config = { aiInstrumentationKey: "testkey" };

    let genericBackend: MockAppInsightsBackend;

    beforeEach(() => {
       genericBackend = new MockAppInsightsBackend(config);
    });

    describe("AppInsightsBackend.init()", () => {
        it("returns true", () => {
            const myConfig = { aiInstrumentationKey: "abc" };
            const fakeEvents = new events.EventEmitter();
            const actual = MockAppInsightsBackend.init(123, myConfig, fakeEvents);
            
            assert.strictEqual(actual, true);
        });
        
        it("adds listener to flush", () => {
            const myConfig = { aiInstrumentationKey: "abc" };
            const fakeEvents = new events.EventEmitter();
            MockAppInsightsBackend.init(123, myConfig, fakeEvents);
            
            assert.strictEqual(fakeEvents.listenerCount("flush"), 1);
        });
    });

    describe("#init()", () => {
        let fakeEvents: events.EventEmitter;
        let eventsMock: Sinon.SinonMock;

        beforeEach(() => {
            fakeEvents = new events.EventEmitter();
            eventsMock = sinon.mock(fakeEvents);
        });
        afterEach(() => {
            eventsMock.restore();
        });

        it("sets up appInsights with correct instrumentation key", () => {
            const backend = new MockAppInsightsBackend({ aiInstrumentationKey: "abc" });

            eventsMock.expects("on").once();

            backend.init(fakeEvents);

            eventsMock.verify();

            const appInsights = backend.getAppInsights();
            assert.ok(appInsights);
            assert.strictEqual(appInsights.client.config.instrumentationKey, "abc");
        });
        
        it("sets up appInsights with correct role name", () => {
            const backend = new MockAppInsightsBackend({ aiInstrumentationKey: "abc", aiRoleName: "myrole" });

            eventsMock.expects("on").once();

            backend.init(fakeEvents);

            eventsMock.verify();

            const appInsights = backend.getAppInsights();
            assert.ok(appInsights);
            const actual = appInsights.client.context.tags[appInsights.client.context.keys.deviceRoleName];
            assert.strictEqual(actual, "myrole");
        });
        
        it("sets up appInsights with correct role name", () => {
            const backend = new MockAppInsightsBackend({ aiInstrumentationKey: "abc", aiRoleInstance: "myinstance" });

            eventsMock.expects("on").once();

            backend.init(fakeEvents);

            eventsMock.verify();

            const appInsights = backend.getAppInsights();
            assert.ok(appInsights);
            const actual = appInsights.client.context.tags[appInsights.client.context.keys.deviceRoleInstance];
            assert.strictEqual(actual, "myinstance");
        });

        it("registers for flush event", () => {
            const backend = new MockAppInsightsBackend({ aiInstrumentationKey: "abc" });

            eventsMock.expects("on")
                      .withArgs("flush")
                      .once();

            backend.init(fakeEvents);

            eventsMock.verify();
        });
    });

    describe("#onFlush", () => {
        const ts = new Date(2001, 2, 3, 4, 5, 6, 7).toISOString();

        let fakeEvents: any;
        let aiClientMock: Sinon.SinonMock;

        beforeEach(() => {
            fakeEvents = { on: sinon.stub() };
            genericBackend.init(fakeEvents);
            aiClientMock = sinon.mock(genericBackend.getAppInsights().client);
        });
        afterEach(() => {
            aiClientMock.restore();
        });

        it("flushes a single counter without properties", () => {
            aiClientMock.expects("trackMetric")
                        .calledWithExactly("mycounter", 87, null, null, null, null, undefined);

            genericBackend.onFlush(ts, { counters: { "mycounter": 87 } });

            aiClientMock.verify();
        });
        
        it("flushes a single counter with properties", () => {
            const props = { "myprop": "myvalue" };
            aiClientMock.expects("trackMetric")
                        .calledWithExactly("mycounter", 87, null, null, null, null, props);

            const base64Properties = new Buffer(JSON.stringify(props)).toString("base64");
            const metricName = "mycounter__" + base64Properties;
            const metrics: any = { counters: {} };
            metrics.counters[metricName] = 87;
            
            genericBackend.onFlush(ts, metrics);

            aiClientMock.verify();
        });
        
        it("flushes a single counter with invalid properties", () => {
            aiClientMock.expects("trackException")
                        .once();
                        
            aiClientMock.expects("trackMetric")
                        .calledWithExactly("mycounter", 87, null, null, null, null, undefined);

            genericBackend.onFlush(ts, { counters: { "mycounter__{ blash blash": 87 } });

            aiClientMock.verify();
        });

        it("flushes timer data without properties", () => {
            aiClientMock.expects("trackMetric")
                        .calledWithExactly("mytimer", 1, 2, 3, 4, 5, undefined);

            genericBackend.onFlush(ts, { timer_data: { "mytimer": { sum: 1, count: 2, lower: 3, upper: 4, std: 5 } } });

            aiClientMock.verify();
        });
        
        it("flushes timer data with properties", () => {
            const props = { "myprop": "myvalue" };
            aiClientMock.expects("trackMetric")
                        .calledWithExactly("mytimer", 1, 2, 3, 4, 5, props);

            const base64Properties = new Buffer(JSON.stringify(props)).toString("base64");
            const metricName = "mytimer__" + base64Properties;
            const metrics: any = { timer_data: {} };
            metrics.timer_data[metricName] = { sum: 1, count: 2, lower: 3, upper: 4, std: 5 };
            genericBackend.onFlush(ts, metrics);

            aiClientMock.verify();
        });

        it("flushes a gauge without properties", () => {
            aiClientMock.expects("trackMetric")
                        .calledWithExactly("mygauge", 87, null, null, null, null, undefined);

            genericBackend.onFlush(ts, { gauges: { "mygauge": 87 } });

            aiClientMock.verify();
        });
        
        it("flushes a gauge with properties", () => {
            const props = { "myprop": "myvalue" };
            aiClientMock.expects("trackMetric")
                        .calledWithExactly("mygauge", 87, null, null, null, null, props);

            const base64Properties = new Buffer(JSON.stringify(props)).toString("base64");
            const metricName = "mygauge__" + base64Properties;
            const metrics: any = { gauges: {} };
            metrics.gauges[metricName] = 87;
            genericBackend.onFlush(ts, metrics);

            aiClientMock.verify();
        });
    });

    describe("#parseKey", () => {
        let fakeEvents: events.EventEmitter;
        let aiClientMock: Sinon.SinonMock;

        beforeEach(() => {
            fakeEvents = new events.EventEmitter();
            genericBackend.init(fakeEvents);
            aiClientMock = sinon.mock(genericBackend.getAppInsights().client);
        });
        afterEach(() => {
            aiClientMock.restore();
        });
        
        it("parses key without properties", () => {
            const actual = genericBackend.parseKey("testname");

            assert.strictEqual(actual.metricname, "testname");
            assert.deepStrictEqual(actual.properties, undefined);
        });

        it("parses key with properties", () => {
            const expectedProperties = { "testkey": "testvalue" };
            const base64Properties = new Buffer(JSON.stringify(expectedProperties)).toString("base64");
            const actual = genericBackend.parseKey("testname__" + base64Properties);

            assert.strictEqual(actual.metricname, "testname");
            assert.deepStrictEqual(actual.properties, expectedProperties);
        });

        it("removes prefix if set", () => {
            const prefixedBackend = new MockAppInsightsBackend({ aiPrefix: "myapp" });
            const actual = prefixedBackend.parseKey("myapp.testname");

            assert.strictEqual(actual.metricname, "testname");
        });
        
        it("parses key with invalid properties", () => {
            aiClientMock.expects("trackException")
                        .once();
            
            const actual = genericBackend.parseKey("testname__{sdsfs");
            
            aiClientMock.verify();

            assert.strictEqual(actual.metricname, "testname");
            assert.deepStrictEqual(actual.properties, undefined);
        });
    });

    describe("#shouldProcess", () => {
        it("returns false for statsd metric and trackStatsDMetrics is false", () => {
            const actual = genericBackend.shouldProcess("statsd.mymetric");

            assert.strictEqual(actual, false);
        });

        it("returns true for statsd metric and trackStatsDMetrics is true", () => {
            const trackStatsBackend = new MockAppInsightsBackend({ aiTrackStatsDMetrics: true });
            const actual = trackStatsBackend.shouldProcess("statsd.mymetric");

            assert.strictEqual(actual, true);
        });

        it("returns true when prefix is set and prefix matches", () => {
            const prefixedBackend = new MockAppInsightsBackend({ aiPrefix: "myapp" });
            const actual = prefixedBackend.shouldProcess("myapp.mymetric");

            assert.strictEqual(actual, true);
        });

        it("returns false when prefix is set and prefix does not exist", () => {
            const prefixedBackend = new MockAppInsightsBackend({ aiPrefix: "myapp" });
            const actual = prefixedBackend.shouldProcess("mymetric");

            assert.strictEqual(actual, false);
        });

        it("returns false when prefix is set and prefix does not match", () => {
            const prefixedBackend = new MockAppInsightsBackend({ aiPrefix: "myapp" });
            const actual = prefixedBackend.shouldProcess("myapp1.mymetric");

            assert.strictEqual(actual, false);
        });

        it("returns false when prefix is set and prefix does not match and trackStatsDMetrics is true", () => {
            const prefixedBackend = new MockAppInsightsBackend({ aiPrefix: "myapp", aiTrackStatsDMetrics: true });
            const actual = prefixedBackend.shouldProcess("myapp1.mymetric");

            assert.strictEqual(actual, false);
        });

        it("returns true for standard metric with prefix", () => {
            const actual = genericBackend.shouldProcess("myapp.mymetric");

            assert.strictEqual(actual, true);
        });

        it("returns true for standard metric without prefix", () => {
            const actual = genericBackend.shouldProcess("mymetric");

            assert.strictEqual(actual, true);
        });
    });
});