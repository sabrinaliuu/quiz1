import { defineStore } from 'pinia';
const api_token = import.meta.env.VITE_MY_API_TOKEN;
export const useRouteStore = defineStore('route', {
  state: () => ({
    segments: {
      AtoB: null,
      BtoC: null,
      CtoD: null
    },
    lastCoordsKey: null,
    simulationSegments: null, 
    isLoaded: false,
    totalTime: 0,
    resABTime: 'N/A',
    resBCTime: 'N/A',
    resCDTime: 'N/A',
    API_TOKEN: api_token
  }),

  actions: {

    formatTime(seconds) {
      if (!seconds && seconds !== 0) return 'N/A';
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}分 ${secs.toString().padStart(2, '0')}秒`;
    },

    directionsAPI(mode, coords, API_TOKEN) {
      const baseUrl = "https://api.mapbox.com/directions/v5/mapbox/";
      const coordinates = coords.map(c => c.join(',')).join(';');
      const url = `${baseUrl}${mode}/${coordinates}?alternatives=false&annotations=distance,duration,speed&continue_straight=true&geometries=geojson&language=en&overview=full&steps=true&access_token=${API_TOKEN}`;
      return url;
    },

    async fetchAllRoutes(allCoords, type = 'example') {

      const currentKey = JSON.stringify(allCoords);

      // check same route or not 
      if (this.isLoaded && this.lastCoordsKey === currentKey) {
        // if same, do not fetch route data again, use the same Segments
        //console.log('Same data');
        return this.simulationSegments;
      }

      this.isLoaded = false;
      try {

        let resAB, resBC, resCD;
        if (type === 'example') {

          const results = await Promise.all([
            fetch('/data/route/AtoB.geojson').then(r => {
              return r.json();
            }),
            fetch('/data/route/BtoC.geojson').then(r => {
              return r.json();
            }),
            fetch('/data/route/CtoD.geojson').then(r => {
              return r.json();
            })
          ]);
          
          resAB = results[0];
          resBC = results[1];
          resCD = results[2];
        } else {
          // get route (navigation) from mapbox direction API
          resAB = await fetch(this.directionsAPI('walking', [allCoords.A, allCoords.B], this.API_TOKEN)).then(r => r.json());
          resBC = await fetch(this.directionsAPI('cycling', [allCoords.B, allCoords.C], this.API_TOKEN)).then(r => r.json());
          resCD = await fetch(this.directionsAPI('walking', [allCoords.C, allCoords.D], this.API_TOKEN)).then(r => r.json());
        }
        
        // store routes
        this.segments.AtoB = resAB;
        this.segments.BtoC = resBC;
        this.segments.CtoD = resCD;

        // conbine all routes(segments) together
        this.simulationSegments = [
          {
            label: '步行：起點 -> 借車站',
            mode: 'walking',
            coords: resAB.routes[0].geometry.coordinates,
            duration: resAB.routes[0].duration 
          },
          {
            label: '騎行：借車站 -> 還車站',
            mode: 'cycling',
            coords: resBC.routes[0].geometry.coordinates,
            duration: resBC.routes[0].duration
          },
          {
            label: '步行：還車站 -> 終點',
            mode: 'walking',
            coords: resCD.routes[0].geometry.coordinates,
            duration: resCD.routes[0].duration
          }
        ];

        // calculate moving duration for each part
        this.resABTime = this.formatTime(resAB.routes[0].duration);
        this.resBCTime = this.formatTime(resBC.routes[0].duration);
        this.resCDTime = this.formatTime(resCD.routes[0].duration);
        this.totalTime = this.formatTime(this.simulationSegments.reduce((acc, seg) => acc + seg.duration, 0));
        
        this.lastCoordsKey = currentKey;
        this.isLoaded = true;
        //console.log('Total time:', this.totalTime);
        
        return this.simulationSegments;
      } catch (error) {
        console.error('errro:', error);
        this.lastCoordsKey = null;
        this.isLoaded = false;
        throw error;
      }
    } 
  }
});

