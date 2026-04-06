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
        this.rutaFincaApi.get("/getAll",controllerConsultarFincas.getAll);
        this.rutaFincaApi.post("/create", controllerCrearFinca.crear);
        this.rutaFincaApi.put("/update/:idFinca", controllerFincaActualizar.actualizar);
        this.rutaFincaApi.delete("/delete/:idFinca", controllerFincaBorrar.eliminar);
    }
}
const rutasFinca = new RouterFinca();
export default rutasFinca.rutaFincaApi;