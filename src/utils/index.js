export function compareRouteNumbers(routeA, routeB) {
  const a = parseInt(routeA.replace(/[^0-9]/g, ''), 10)
  const b = parseInt(routeB.replace(/[^0-9]/g, ''), 10)
  if (a < b) {
    return -1
  }
  if (a > b) {
    return 1
  }
  return 0
}
