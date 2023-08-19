import { Injectable } from '@nestjs/common';
import axios, { AxiosResponse } from 'axios';
import { HttpService } from '@nestjs/axios';
import Ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import * as stream from 'stream';
import OneAI from 'oneai';

@Injectable()
export class AppService {
  private readonly clientId: string = process.env.CLIENT_ID;
  private readonly clientSecret: string = process.env.CLIENT_SECRET;
  oneai = new OneAI(process.env.ONE_AI_KEY);

  constructor(private httpService: HttpService) {}

  async naverStt(data): Promise<AxiosResponse<{ text: string }>> {
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

  async oneAiStt() {
    console.log('one Ai Stt');
    const text =
      'Whether to power translation to document summarization, enterprises are increasing their investments in natural language processing (NLP) technologies. According to a 2021 survey from John Snow Labs and Gradient Flow, 60% of tech leaders indicated that their NLP budgets grew by at least 10% compared to 2020, while a third said that spending climbed by more than 30%';
    const pipeline = new this.oneai.Pipeline(this.oneai.skills.summarize());
    pipeline.run(text).then(console.log);
  }

  getVideoStream = async (url: string) => {
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream',
    });
    return response.data as stream.Readable;
  };

  convertVideoStreamToDividedAudio = async (
    streamData: stream.Readable,
    format: string,
  ) => {
    return Ffmpeg()
      .setFfmpegPath(ffmpegPath)
      .input(streamData)
      .toFormat(format)
      .outputOptions(['-f segment', '-segment_time 10', '-c copy'])
      .pipe();
  };

  convertVideoStreamToAudio = async (
    streamData: stream.Readable,
    format: string,
  ) => {
    return Ffmpeg()
      .setFfmpegPath(ffmpegPath)
      .input(streamData)
      .toFormat(format)
      .pipe();
  };
}
