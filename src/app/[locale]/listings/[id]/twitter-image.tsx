import OpengraphImage from "./opengraph-image";

// Same card as Open Graph; segment config must be literal values, so it's repeated here
export const size = { width: 1200, height: 630 };
export const contentType = "image/jpeg";
export const revalidate = 3600;
export const alt = "Maroclist";

export default OpengraphImage;
