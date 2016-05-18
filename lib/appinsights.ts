/**
 * Application Insights StatsD backend
 */

console.log("[aibackend] Starting...");

import events = require("events");
import util = require("util");

import ai = require("applicationinsights");

class AppInsightsBackend {
    protected prefix: string;
    protected roleName: string;
    protected roleInstance: string;
    protected instrumentationKey: string;
    protected trackStatsDMetrics: boolean = false;
    
    protected appInsights: ApplicationInsights;
    protected get aiClient(): Client {
        return this.appInsights.client;
    }
    
    public static init = function(startupTime: number, config: any, events: events.EventEmitter) {
        const instance = new AppInsightsBackend(config);
        instance.init(events);
        return true;
    };
    
    public constructor(config: any) {
       this.roleName = config.aiRoleName;
       this.roleInstance = config.aiRoleInstance;
       this.instrumentationKey = config.aiInstrumentationKey;
       
       if (!!config.aiPrefix) {
           this.prefix = config.aiPrefix + ".";
       }
       if (!!config.aiTrackStatsDMetrics) {
           this.trackStatsDMetrics = config.aiTrackStatsDMetrics;
       }
    }
    
    protected init(events: events.EventEmitter) {
        console.log("[aibackend] Initializing");
        
        this.appInsights = ai.setup(this.instrumentationKey);
        
        if (this.roleName) {
            this.aiClient.context.tags[this.aiClient.context.keys.deviceRoleName] = this.roleName;
        }
        if (this.roleInstance) {
            this.aiClient.context.tags[this.aiClient.context.keys.deviceRoleInstance] = this.roleInstance;    
        }

        console.log("[aibackend] Registering for 'flush' event");
        events.on("flush", this.onFlush.bind(this));
    }
    
    protected onFlush(timestamp: string, metrics: any) {
        console.log("[aibackend] OnFlush called");
        
        // Process counters
        let countersTracked = 0;
        for (const counterKey in metrics.counters) {
            if (!this.shouldProcess(counterKey)) {
                continue;
            }
            const parsedCounterKey = this.parseKey(counterKey);
            const counter = metrics.counters[counterKey];
            
            this.aiClient.trackMetric(parsedCounterKey.metricname, counter, null, null, null, null, parsedCounterKey.properties);
            countersTracked++;
        };
        console.log("[aibackend] %d counters tracked", countersTracked);
        	
        // Process timer data
        let timerDataTracked = 0;
        for (const timerKey in metrics.timer_data) {
            if (!this.shouldProcess(timerKey)) {
                continue;
            }
            const parsedTimerKey = this.parseKey(timerKey);
            const timer = metrics.timer_data[timerKey];
            
            this.aiClient.trackMetric(
                parsedTimerKey.metricname, 
                timer.sum,
                timer.count,
                timer.lower,
                timer.upper,
                timer.std,
                parsedTimerKey.properties);
            timerDataTracked++;
        };
        console.log("[aibackend] %d timer data tracked", timerDataTracked);

        // Process gauges
        let gaugesTracked = 0;
        for (const gaugeKey in metrics.gauges) {
            if (!this.shouldProcess(gaugeKey)) {
                continue;
            }
            const parsedGaugeKey = this.parseKey(gaugeKey);
            const gauge = metrics.gauges[gaugeKey];
            
            this.aiClient.trackMetric(parsedGaugeKey.metricname, gauge, null, null, null, null, parsedGaugeKey.properties);
            gaugesTracked++;
        };
        console.log("[aibackend] %d gauges tracked", gaugesTracked);
        
        console.log("[aibackend] OnFlush completed");

        return true;
    }
    
    protected shouldProcess(key: string): boolean  {
        if (!this.trackStatsDMetrics && key.indexOf("statsd.") === 0) {
            return false;
        }
        
        if (this.prefix !== undefined && this.prefix !== null) {
            return key.indexOf(this.prefix) === 0;
        }
        
        return true;
    }
    
    protected parseKey(key: string) {
        // Remove the prefix if it is set
        if (this.prefix) {
            if (key.indexOf(this.prefix) === 0) {
                key = key.substr(this.prefix.length);
            }
        }

        // Get metric name
        const endOfNameIndex = key.indexOf("__");
        const metricName = endOfNameIndex > 0 ? key.substring(0, endOfNameIndex) : key;

        // Get properties
        let properties: { [key: string]: string } = undefined;
        if (endOfNameIndex > 0) {
            const propertiesString = key.substring(endOfNameIndex + 2);

            try {
                const buffer = new Buffer(propertiesString, "base64");
                properties = JSON.parse(buffer.toString("utf8"));
            } catch (error) {
                this.aiClient.trackException(new Error("Failed to parse properties string from key '" + key + "': " + util.inspect(error)));
            }
        }

        return {
            metricname : metricName,
            properties: properties,
        };
    }
};

console.log("[aibackend] Started");

export = AppInsightsBackend;