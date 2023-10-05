import http from 'k6/http';
import { ServiceDisruptor } from 'k6/x/disruptor';

export const options = {
    scenarios: {
        load: {
            executor: 'constant-vus',
            vus: 20,
            duration: '30s',
        },
        inject: {
            executor: 'shared-iterations',
            iterations: 1,
            vus: 1,
            exec: 'injectFaults',
            startTime: '0s',
        }
    },
    thresholds: {
        'http_reqs{expected_response:true}': ['rate>10'],
    },
};

export function injectFaults() {
    const fault = {
        averageDelay: '1500ms',
        errorRate: 0.8,
        errorCode: 500,
    };

    const disruptor = new ServiceDisruptor('otel-demo-recommendationservice', 'otel-demo');
    disruptor.injectHTTPFaults(fault, '1m');
}

export default function () {
    // We're not worrying about the responses...just generate a spike of activity
    //  viewable in Grafana at
    http.get('http://localhost:8080/api/recommendations/');
}
