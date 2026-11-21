// The date maths depends on the local time zone (daylight saving in particular), so
// the tests run in one that has it, whatever the machine or CI runner is set to.
export default function setup() {
  process.env.TZ = 'America/New_York'
}
