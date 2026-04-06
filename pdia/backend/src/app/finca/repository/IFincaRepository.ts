import { FincaResponseDto, FincaUpdateDto, FincaCreateDto, FincaIdDto } from "../model/dto/dtoFinca";

export interface IFincaRepository {
    getAll(): Promise<FincaResponseDto[]>;
    create(obj: FincaCreateDto): Promise<any>;
    update(obj: FincaUpdateDto): Promise<any>;
    delete(obj: FincaIdDto): Promise<any>;
}