import axios from "axios";
import { pool } from "../config/db.js";
import { publishEvent } from "../config/rabbitmq.js";

const OPEN_METEO_BASE_URL = process.env.OPEN_METEO_BASE_URL || "https://api.open-meteo.com/v1";

export interface WeatherData {
  temperatura: number;
  humedad: number;
  probabilidadLluvia: number;
  velocidadViento: number;
  timestamp: Date;
}

export interface ForecastDay {
  fecha: string;
  tempMax: number;
  tempMin: number;
  probabilidadLluvia: number;
}

export class WeatherService {
  async fetchWeather(lat: number, lon: number): Promise<WeatherData> {
    try {
      const url = `${OPEN_METEO_BASE_URL}/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation_probability,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=America%2FBogota&forecast_days=5`;

      const response = await axios.get(url);
      const data = response.data;

      return {
        temperatura: data.current.temperature_2m,
        humedad: data.current.relative_humidity_2m,
        probabilidadLluvia: data.current.precipitation_probability,
        velocidadViento: data.current.wind_speed_10m,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error("❌ Error fetching weather from Open-Meteo:", error);
      throw new Error("No se pudo obtener los datos climáticos");
    }
  }

  async getForecast(lat: number, lon: number): Promise<ForecastDay[]> {
    try {
      const url = `${OPEN_METEO_BASE_URL}/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=America%2FBogota&forecast_days=5`;

      const response = await axios.get(url);
      const data = response.data;

      return data.daily.time.map((date: string, i: number) => ({
        fecha: date,
        tempMax: data.daily.temperature_2m_max[i],
        tempMin: data.daily.temperature_2m_min[i],
        probabilidadLluvia: data.daily.precipitation_probability_max[i],
      }));
    } catch (error) {
      console.error("❌ Error fetching forecast:", error);
      throw new Error("No se pudo obtener el pronóstico");
    }
  }

  async getWeatherByParcela(parcelaId: number): Promise<{ current: WeatherData; forecast: ForecastDay[] } | null> {
    const result = await pool.query("SELECT latitud, longitud FROM parcelas WHERE id = $1", [parcelaId]);
    if (result.rows.length === 0) return null;

    const { latitud, longitud } = result.rows[0];
    const current = await this.fetchWeather(Number(latitud), Number(longitud));
    const forecast = await this.getForecast(Number(latitud), Number(longitud));

    return { current, forecast };
  }

  async pollAllParcelas(): Promise<void> {
    try {
      const parcelas = await pool.query(
        "SELECT p.id, p.latitud, p.longitud, p.finca_id, c.id as cultivo_id FROM parcelas p JOIN cultivos c ON p.id = c.parcela_id"
      );

      for (const parcela of parcelas.rows) {
        try {
          const weather = await this.fetchWeather(Number(parcela.latitud), Number(parcela.longitud));

          await publishEvent("weather.updated", {
            parcelaId: parcela.id,
            cultivoId: parcela.cultivo_id,
            temperature: weather.temperatura,
            humedad: weather.humedad,
            probabilidadLluvia: weather.probabilidadLluvia,
            velocidadViento: weather.velocidadViento,
            timestamp: weather.timestamp.toISOString(),
          });

          console.log(`📡 Weather updated for parcela ${parcela.id}: ${weather.temperatura}°C`);
        } catch (error) {
          console.error(`❌ Error polling parcela ${parcela.id}:`, error);
        }
      }
    } catch (error) {
      console.error("❌ Error in pollAllParcelas:", error);
    }
  }
}