import { Router } from "express";
import controllerConsultarFincas from "../controller/ControllerConsultarFinca";
import controladorCrearFinca from "../controller/ControllerCrearFinca";
import controllerCrearFinca from "../controller/ControllerCrearFinca";
import controllerFincaActualizar from "../controller/ControllerFincaActualizar";
import controllerFincaBorrar from "../controller/ControllerEliminarfinca";
class RouterFinca{
    public rutaFincaApi: Router;
    constructor() {
        this.rutaFincaApi = Router();
        this.configurarRutas();

    }
    public configurarRutas(): void {
        this.rutaFincaApi.get("/",controllerConsultarFincas.getAll);
        this.rutaFincaApi.post("/", controllerCrearFinca.crear);
        this.rutaFincaApi.put("/:idFinca", controllerFincaActualizar.actualizar);
        this.rutaFincaApi.delete("/:idFinca", controllerFincaBorrar.eliminar);
    }
}
const rutasFinca = new RouterFinca();
export default rutasFinca.rutaFincaApi;