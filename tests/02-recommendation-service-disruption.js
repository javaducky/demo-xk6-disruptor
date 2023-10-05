import http from 'k6/http';
import { ServiceDisruptor } from 'k6/x/disruptor';

export const options = {
    vus: 10,
    duration: '10s',
    thresholds: {
        'http_reqs{expected_response:true}': ['rate>10'],
    },
};

export function setup() {
    const fault = {
        averageDelay: '1500ms',
        errorRate: 0.1,
        errorCode: 500,
    };

    const disruptor = new ServiceDisruptor('otel-demo-recommendationservice', 'otel-demo');
    disruptor.injectHTTPFaults(fault, '30s');
}

export default function () {
    // We're not worrying about the responses...just generate a spike of activity
    //  viewable in Grafana at
    http.get('http://localhost:8080/api/recommendations/');
}
