import { Injectable } from '@nestjs/common';
import axios, { AxiosResponse } from 'axios';
import { HttpService } from '@nestjs/axios';
import Ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import * as stream from 'stream';
import OneAI from 'oneai';
import path from 'path';
import { promisify } from 'util';
import { PassThrough } from 'stream';
import fs from 'fs-extra';

function generateRandomString(length: number = 8): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    result += chars.charAt(randomIndex);
  }

  return result;
}

@Injectable()
export class AppService {
  private readonly clientId: string = process.env.CLIENT_ID;
  private readonly clientSecret: string = process.env.CLIENT_SECRET;
  oneai = new OneAI(process.env.ONE_AI_KEY, {
    multilingual: {
      enabled: true,
      allowed_input_languages: ['kr'],
      expected_languages: ['kr'],
      translate_output_to: 'kr',
    },
  });

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
      console.log(response.data);
      return response.data;
    } catch (error) {
      throw new Error(`Error in STT Service: ${error.message}`);
    }
  }

  async oneAiStt(pathUrl: string) {
    const pipeline = new this.oneai.Pipeline(this.oneai.skills.transcribe());
    const filePath = path.join(__dirname, '..', 'public', 'test.mp3');
    return await pipeline
      .runFile(filePath)
      .then(console.log)
      .catch(console.log);
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

  saveAudioStreamConvertedVideo = async (
    streamData: stream.Readable,
    format: string,
  ) => {
    return Ffmpeg()
      .setFfmpegPath(ffmpegPath)
      .input(streamData)
      .toFormat(format)
      .save(`/output.mp3`);
  };

  convertAndSplitAudio = async (
    streamData: stream.Readable,
  ): Promise<Buffer[]> => {
    const outputPath = 'output';
    const segmentDuration = 60;
    const randomString = generateRandomString(8);

    await new Promise<void>((resolve, reject) => {
      let segmentNumber = 0;
      Ffmpeg()
        .setFfmpegPath(ffmpegPath)
        .input(streamData)
        .toFormat('mp3')
        .outputOptions([
          `-f segment`,
          `-segment_time ${segmentDuration}`,
          `-reset_timestamps 1`,
          `-map 0:a`, // 비디오에서 오디오 스트림만 추출
        ])
        .save(`${outputPath}/${randomString}_%03d.mp3`)
        .on('end', resolve)
        .on('error', reject)
        .on('progress', (progress) => {
          if (progress.percent > segmentNumber * (100 / segmentDuration)) {
            segmentNumber++;
            console.log(`Segment ${segmentNumber} processed`);
          }
        });
    });
    const outputFiles = [];
    const outputDirFiles = await fs.readdir(outputPath);
    for (const file of outputDirFiles) {
      if (file.startsWith(`${randomString}_`)) {
        const fileBuffer = await fs.readFile(path.join(outputPath, file));
        outputFiles.push(fileBuffer);
        await fs.remove(path.join(outputPath, file));
      }
    }

    return outputFiles;
  };
}
