import { Injectable } from '@nestjs/common';
import axios, { AxiosResponse } from 'axios';
import { HttpService } from '@nestjs/axios';
import Ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';

@Injectable()
export class AppService {
  private readonly clientId: string = process.env.CLIENT_ID;
  private readonly clientSecret: string = process.env.CLIENT_SECRET;

  constructor(private httpService: HttpService) {}

  async stt(data): Promise<AxiosResponse<{ text: string }>> {
    console.log('get stt');
    const url = 'https://naveropenapi.apigw.ntruss.com/recog/v1/stt?lang=Kor';
    const headers = {
      'Content-Type': 'application/octet-stream',
      'X-NCP-APIGW-API-KEY-ID': this.clientId,
      'X-NCP-APIGW-API-KEY': this.clientSecret,
    };

    try {
      const response = await this.httpService
        .post(url, data, { headers })
        .toPromise();
      return response.data;
    } catch (error) {
      throw new Error(`Error in STT Service: ${error.message}`);
    }
  }

  getVideoStream = async (url: string) => {
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream',
    });
    return response.data;
  };

  convertVideoStreamToAudio = async (streamData, format) => {
    return Ffmpeg()
      .setFfmpegPath(ffmpegPath)
      .input(streamData)
      .toFormat(format)
      .pipe();
  };
}
