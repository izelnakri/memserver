export default function(statusCode=200, headers={}, data={}) {
  return [
    statusCode,
    Object.assign({ 'Content-Type': 'application/json' }, headers),
    JSON.stringify(data)
  ];
}
