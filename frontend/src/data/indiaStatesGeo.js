// GeoJSON for the 9 Indian States present in the dataset
export const INDIA_DATASET_STATES = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { state: 'Punjab', code: 'PB', zone: 'North', cities: ['Ludhiana', 'Amritsar', 'Jalandhar'] },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [74.0, 30.0], [74.5, 29.8], [75.2, 29.7], [75.8, 29.8],
          [76.3, 30.0], [76.9, 30.3], [76.9, 31.0], [76.5, 31.3],
          [76.0, 31.8], [75.8, 32.3], [75.3, 32.5], [74.8, 32.2],
          [74.5, 31.8], [74.2, 31.3], [74.0, 30.7], [74.0, 30.0]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: { state: 'Maharashtra', code: 'MH', zone: 'West', cities: ['Mumbai', 'Pune'] },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [72.6, 19.8], [73.0, 20.3], [74.0, 21.0], [75.0, 21.5],
          [76.5, 21.4], [78.0, 21.6], [79.2, 21.7], [80.5, 21.4],
          [80.9, 20.0], [80.3, 19.0], [79.2, 18.7], [78.0, 18.0],
          [77.0, 18.2], [76.0, 17.7], [75.0, 17.5], [74.0, 16.0],
          [73.5, 15.8], [73.2, 16.5], [72.8, 18.0], [72.7, 19.0], [72.6, 19.8]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: { state: 'Tamil Nadu', code: 'TN', zone: 'South', cities: ['Chennai'] },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [77.5, 8.1], [78.0, 8.5], [79.0, 9.2], [79.3, 10.3],
          [79.9, 10.8], [79.9, 11.8], [80.3, 13.4], [79.8, 13.5],
          [79.2, 13.0], [78.5, 12.8], [77.8, 12.3], [77.0, 11.8],
          [76.8, 11.0], [77.0, 10.0], [77.3, 9.0], [77.5, 8.1]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: { state: 'Karnataka', code: 'KA', zone: 'South', cities: ['Bengaluru'] },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [74.0, 14.8], [74.5, 15.5], [75.0, 16.5], [76.0, 17.2],
          [77.0, 18.0], [77.6, 17.5], [77.3, 16.2], [77.5, 15.0],
          [77.7, 14.0], [77.8, 13.0], [77.2, 12.0], [76.5, 11.8],
          [75.5, 12.3], [74.8, 13.2], [74.3, 14.0], [74.0, 14.8]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: { state: 'West Bengal', code: 'WB', zone: 'East', cities: ['Kolkata'] },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [87.5, 21.6], [88.5, 21.6], [89.1, 22.0], [89.0, 23.0],
          [88.8, 24.0], [88.2, 25.0], [88.5, 26.5], [88.2, 27.2],
          [87.8, 26.8], [88.0, 25.5], [87.5, 24.5], [86.8, 23.8],
          [86.2, 23.0], [86.8, 22.2], [87.5, 21.6]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: { state: 'Delhi', code: 'DL', zone: 'North', cities: ['Delhi'] },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [76.85, 28.5], [77.0, 28.4], [77.25, 28.4], [77.35, 28.55],
          [77.33, 28.75], [77.2, 28.88], [77.0, 28.85], [76.88, 28.7], [76.85, 28.5]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: { state: 'Telangana', code: 'TS', zone: 'South', cities: ['Hyderabad'] },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [77.5, 17.5], [78.2, 18.5], [78.8, 19.8], [79.8, 19.5],
          [80.5, 18.8], [81.3, 17.8], [80.5, 17.0], [79.8, 16.5],
          [79.0, 16.0], [78.2, 16.2], [77.6, 16.8], [77.5, 17.5]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: { state: 'Uttar Pradesh', code: 'UP', zone: 'North', cities: ['Lucknow'] },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [77.2, 28.0], [77.5, 29.5], [78.0, 30.0], [78.8, 29.5],
          [80.0, 28.8], [81.5, 28.2], [83.0, 27.5], [84.2, 27.2],
          [84.4, 26.0], [83.5, 25.0], [83.0, 24.0], [82.0, 24.2],
          [81.0, 25.0], [79.8, 25.2], [78.8, 25.0], [78.2, 26.0],
          [77.5, 27.2], [77.2, 28.0]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: { state: 'Rajasthan', code: 'RJ', zone: 'North', cities: ['Jaipur'] },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [70.0, 27.0], [71.5, 28.0], [73.0, 29.5], [74.0, 30.0],
          [75.2, 29.0], [76.5, 28.2], [77.4, 27.8], [77.5, 26.8],
          [76.8, 25.5], [76.0, 24.5], [75.0, 24.0], [74.0, 23.5],
          [73.0, 24.2], [71.5, 24.8], [70.5, 25.8], [70.0, 27.0]
        ]]
      }
    }
  ]
};
