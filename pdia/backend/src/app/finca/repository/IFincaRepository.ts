import { FincaResponseDto, FincaUpdateDto, FincaCreateDto, FincaIdDto } from "../model/dto/dtoFinca";

export interface IFincaRepository {
    getAll(): Promise<FincaResponseDto[]>;
    findById(id: number): Promise<FincaResponseDto | null>;
    create(obj: FincaCreateDto): Promise<any>;
    update(obj: FincaUpdateDto): Promise<any>;
    delete(obj: FincaIdDto): Promise<any>;
    checkDuplicate(nombre: string, municipio: string, productorId: number): Promise<number>;
    checkProductorExists(productorId: number): Promise<boolean>;
    checkDuplicateUpdate(nombre: string, productorId: number, fincaId: number): Promise<number>;
}