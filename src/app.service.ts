import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import { AxiosResponse } from 'axios';
import { HttpService } from '@nestjs/axios';
import * as path from 'path';

@Injectable()
export class AppService {
  private readonly clientId: string = process.env.CLIENT_ID;
  private readonly clientSecret: string = process.env.CLIENT_SECRET;

  constructor(private httpService: HttpService) {}

  async stt(): Promise<AxiosResponse<{ text: string }>> {
    const url = 'https://naveropenapi.apigw.ntruss.com/recog/v1/stt?lang=Kor';
    const headers = {
      'Content-Type': 'application/octet-stream',
      'X-NCP-APIGW-API-KEY-ID': this.clientId,
      'X-NCP-APIGW-API-KEY': this.clientSecret,
    };
    const filePath = path.join(__dirname, '..', 'public', 'test.mp3');
    const data = fs.createReadStream(filePath);

    try {
      const response = await this.httpService
        .post(url, data, { headers })
        .toPromise();
      return response.data;
    } catch (error) {
      throw new Error(`Error in STT Service: ${error.message}`);
    }
  }
}
