import http from 'k6/http';
import { PodDisruptor } from 'k6/x/disruptor';

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
    // Create a new pod disruptor with a selector
    // that matches pods from the "default" namespace with the label "app=my-app"
    // const disruptor = new PodDisruptor({
    //     namespace: "otel-demo",
    //     select: { labels: { "app.kubernetes.io/component": "recommendationservice" } },
    // });
    //
    // // Disrupt the targets by injecting HTTP faults into them for 30 seconds
    // const fault = {
    //     averageDelay: '500ms',
    //     errorRate: 0.1,
    //     errorCode: 500
    // }
    // disruptor.injectHTTPFaults(fault, "30s")

    const selector = {
        namespace: 'otel-demo',
        select: {
            labels: {
                'app.kubernetes.io/component': 'recommendationservice',
            },
        },
    };

    const fault = {
        averageDelay: '1500ms',
        errorRate: 0.8,
        errorCode: 500,
        port: 8080,
    };

    const disruptor = new PodDisruptor(selector);
    disruptor.injectHTTPFaults(fault, '30s');
}

export default function () {
    // We're not worrying about the responses...just generate a spike of activity
    //  viewable in Grafana at
    http.get('http://localhost:8080/api/recommendations/');

}
