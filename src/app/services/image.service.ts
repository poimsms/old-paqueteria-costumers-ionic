import { Injectable } from '@angular/core';
import { FileTransfer, FileUploadOptions, FileTransferObject } from '@ionic-native/file-transfer/ngx';
import { ConfigService } from './config.service';


@Injectable({
  providedIn: 'root'
})
export class ImageService {

  constructor(private transfer: FileTransfer, private _config: ConfigService) { }

  uploadImage(img) {

    const fileTransfer: FileTransferObject = this.transfer.create();

    const url = `${this._config.apiURL}/imgs/upload`;

    const targetPath = img;

    const options: FileUploadOptions = {
      fileKey: 'image',
      chunkedMode: false,
      mimeType: 'multipart/form-data'
    };

    return fileTransfer.upload(targetPath, url, options);
  }
}
