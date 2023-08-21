import { IsNumber } from 'class-validator';

export class saveScriptDto {
  @IsNumber()
  id: number;
}
