export function toRadians(angle: number) {
    return angle * Math.PI / 180
}

const EarthRadius_Km = 6371
export function calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
): number {
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(lat1)) *
                Math.cos(toRadians(lat2)) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return EarthRadius_Km * c;
}
