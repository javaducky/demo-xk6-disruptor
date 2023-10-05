import http from 'k6/http';

export const options = {
    vus: 20,
    duration: '30s',
    thresholds: {
        'http_reqs{expected_response:true}': ['rate>10'],
    },
};

export default function () {
    // We're not worrying about the responses...just generate a spike of activity
    //  viewable in Grafana at
    http.get('http://localhost:8080/api/recommendations/');
}
