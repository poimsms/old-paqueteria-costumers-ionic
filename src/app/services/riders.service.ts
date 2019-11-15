import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class RidersService {

  constructor() { }


  find_closest_rider(riders, lat, lng, vehiculo) {
    const distanceMatrix = [];
    console.log(riders, 'RIDERSS')

    riders.forEach((rider, i) => {
      if (rider.vehiculo == vehiculo) {
        const distance = Math.sqrt((rider.lat - lat) * (rider.lat - lat) + (rider.lng - lng) * (rider.lng - lng));
        distanceMatrix.push({
          distance,
          id: rider.rider,
          index: i
        });
      }
    });

    if (distanceMatrix.length == 0) {
      return { ok: false }
    }

    let a = distanceMatrix[0].distance;
    let id = distanceMatrix[0].id;
    let b = 0;
    let index = 0;

    distanceMatrix.forEach(item => {
      b = item.distance;
      if (b > a) {
        a = b;
        id = item.id;
        index = item.index;
      }
    });

    return { ok: true, id, index };
  }


  getNeerestRider () {



  //   const negocio_en_linea = true;

  //   const vehiculo = req.body.vehiculo;
  //   const lat = req.body.lat;
  //   const lng = req.body.lng;



  //   if (!negocio_en_linea) {
  //     return res.status(200).json({ ok: false, message: 'No estamos funcionando en este horario!' });
  //   }

  //   if (riders.lenght == 0) {
  //     return res.status(200).json({ ok: false, message: 'Vuelve a intentar en unos momentos!' });
  //   }

  //   const data = find_closest_rider(doc.riders, lat, lng, vehiculo);

  //   if (!data.ok) {
  //     return res.status(200).json({ ok: false, message: 'Vuelve a intentar en unos momentos!' });
  //   }

  //   const update_rider = `${baseURL}?tipo=solicitar_rider?id=${data.id}`;
  //   axios.get(update_rider);

  //   doc.riders.splice(data.index, 1);

  //   res.status(200).json({ ok: true, id });
}

}
