import { Router, Request, Response } from "express";
import { WeatherService } from "../services/weather.service.js";

const router = Router();
const weatherService = new WeatherService();

router.get("/current/:parcelaId", async (req: Request, res: Response) => {
  try {
    const result = await weatherService.getWeatherByParcela(parseInt(req.params.parcelaId));
    if (!result) return res.status(404).json({ error: "Parcela no encontrada" });
    res.json(result.current);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/forecast/:parcelaId", async (req: Request, res: Response) => {
  try {
    const result = await weatherService.getWeatherByParcela(parseInt(req.params.parcelaId));
    if (!result) return res.status(404).json({ error: "Parcela no encontrada" });
    res.json(result.forecast);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Devuelve clima actual + pronóstico combinados para una parcela.
// Formato esperado por el frontend: { temperatura, humedad, probabilidadLluvia, velocidadViento, timestamp, forecast }
router.get("/parcela/:parcelaId", async (req: Request, res: Response) => {
  try {
    const result = await weatherService.getWeatherByParcela(parseInt(req.params.parcelaId));
    if (!result) return res.status(404).json({ error: "Parcela no encontrada" });
    res.json({
      ...result.current,
      forecast: result.forecast,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export { router as weatherRouter };