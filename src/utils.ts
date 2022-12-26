export function compareRouteNumbers(routeNumberA: string, routeNumberB: string) {
  const a = parseInt(routeNumberA.replace(/[^0-9]/g, ''), 10)
  const b = parseInt(routeNumberB.replace(/[^0-9]/g, ''), 10)
  if (a < b) {
    return -1
  }
  if (a > b) {
    return 1
  }
  return 0
}
