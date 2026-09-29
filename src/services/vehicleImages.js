/**
 * Central Vehicle Image Resolver & Asset Configuration
 * WinDriveSA Official Fleet Vehicles
 *
 * Implements authoritative vehicle imagery with strict priority resolution:
 * 1. reward.vehicle_image (Custom assigned vehicle image)
 * 2. Default White Toyota Hilux image (for standard Hilux allocations)
 * 3. null / neutral placeholder (when no image assigned and non-Hilux vehicle)
 */

export const WINDRIVESA_HILUX_WHITE_01 = '/images/windrivesa-hilux-white-01.jpg';
export const WINDRIVESA_HILUX_WHITE_02 = '/images/windrivesa-hilux-white-02.jpg';

export const DEFAULT_HILUX_IMAGE_PRIMARY = WINDRIVESA_HILUX_WHITE_01;
export const DEFAULT_HILUX_IMAGE_SECONDARY = WINDRIVESA_HILUX_WHITE_02;

/**
 * Standard White Toyota Hilux specimens for administration assignment/editing
 */
export const WHITE_HILUX_SPECIMENS = [
  {
    id: 'windrivesa-hilux-white-01',
    label: '2026 Toyota Hilux 2.8 GD-6 Legend 4x4 (White Showroom)',
    shortLabel: 'White Showroom Spec',
    url: WINDRIVESA_HILUX_WHITE_01,
    isPrimary: true,
  },
  {
    id: 'windrivesa-hilux-white-02',
    label: '2026 Toyota Hilux GR Sport 4x4 (White Front GR)',
    shortLabel: 'White Front GR Spec',
    url: WINDRIVESA_HILUX_WHITE_02,
    isSecondary: true,
  },
];

// Legacy image URLs that should be safely updated to the authoritative white Hilux asset
const LEGACY_HILUX_URL_SUBSTRINGS = [
  'lh3.googleusercontent.com',
  'photo-1533473359331-0135ef1b58bf', // Old Unsplash Hilux
];

/**
 * Authoritatively resolves the display image for a reward or vehicle object.
 *
 * Hierarchy:
 * 1. reward.vehicle_image / vehicleImage (custom user-assigned image)
 * 2. Authoritative White Toyota Hilux asset (when vehicle is Toyota Hilux or standard default reward)
 * 3. null (renders the neutral vehicle placeholder fallback)
 *
 * @param {Object} vehicleOrReward
 * @returns {string|null}
 */
export function resolveVehicleImage(vehicleOrReward) {
  if (!vehicleOrReward) {
    return DEFAULT_HILUX_IMAGE_PRIMARY;
  }

  // 1. Check for custom assigned vehicle image
  const customImage =
    vehicleOrReward.vehicle_image ||
    vehicleOrReward.vehicleImage ||
    vehicleOrReward.image;

  if (customImage && typeof customImage === 'string' && customImage.trim() !== '') {
    const trimmed = customImage.trim();

    // Check if this is an outdated legacy reference that should be mapped to the white Hilux
    const isLegacyHilux = LEGACY_HILUX_URL_SUBSTRINGS.some((sub) => trimmed.includes(sub));
    if (isLegacyHilux) {
      return DEFAULT_HILUX_IMAGE_PRIMARY;
    }

    // Preserve custom vehicle image (e.g., custom URL, Ford Ranger, BMW, etc.)
    return trimmed;
  }

  // 2. Fall back to standard Toyota Hilux if the vehicle is Toyota / Hilux or standard allocation
  const make = (
    vehicleOrReward.vehicle_make ||
    vehicleOrReward.vehicleMake ||
    vehicleOrReward.make ||
    ''
  ).toLowerCase();

  const model = (
    vehicleOrReward.vehicle_model ||
    vehicleOrReward.vehicleModel ||
    vehicleOrReward.model ||
    ''
  ).toLowerCase();

  // If vehicle is a Toyota Hilux, or empty default prize assignment, use white Hilux
  if (
    make.includes('toyota') ||
    model.includes('hilux') ||
    (!make && !model)
  ) {
    return DEFAULT_HILUX_IMAGE_PRIMARY;
  }

  // 3. For any other vehicle without an image, return null (triggers neutral vehicle placeholder)
  return null;
}
