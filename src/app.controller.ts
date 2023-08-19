import { Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { AxiosResponse } from 'axios';
import path from 'path';
import fs from 'fs';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getStt(): Promise<AxiosResponse<{ text: string }>> {
    const filePath = path.join(__dirname, '..', 'public', 'test.mp3');
    const data = fs.createReadStream(filePath);
    return this.appService.naverStt(data);
  }

  @Get('video')
  async getVideoScript(): Promise<AxiosResponse<{ text: string }>> {
    const videoStream = await this.appService.getVideoStream(
      process.env.TEST_VIDEO_URL,
    );

    const audioStream = await this.appService.convertVideoStreamToAudio(
      videoStream,
      'mp3',
    );
    return this.appService.naverStt(audioStream);
  }

  @Get('divideVideo')
  async getVideoScriptWithDivided() {
    console.log('get videoStream');
    const videoStream = await this.appService.getVideoStream(
      process.env.TEST_VIDEO_URL,
    );
    console.log('divide VideoStream');
    const buffers = await this.appService.convertAndSplitAudio(videoStream);
    console.log(buffers);
    return { text: 'test' };
  }

  @Get('oneAiTest')
  async oneAiTest() {
    return this.appService.oneAiStt('test.mp3');
  }

  @Post('saveAudioStream')
  async saveAudioStream() {
    const videoStream = await this.appService.getVideoStream(
      process.env.TEST_VIDEO_URL,
    );
    this.appService.saveAudioStreamConvertedVideo(videoStream, 'mp3');
  }
}
