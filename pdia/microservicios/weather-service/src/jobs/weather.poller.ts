import { WeatherService } from "../services/weather.service.js";

const POLL_INTERVAL_MINUTES = parseInt(process.env.POLL_INTERVAL_MINUTES || "60");

let intervalHandle: ReturnType<typeof setInterval> | null = null;

export function startWeatherPoller(): void {
  const weatherService = new WeatherService();

  console.log(`⏰ Weather poller started (every ${POLL_INTERVAL_MINUTES} minutes)`);

  weatherService.pollAllParcelas();

  intervalHandle = setInterval(() => {
    void weatherService.pollAllParcelas();
  }, POLL_INTERVAL_MINUTES * 60 * 1000);
}

export function stopWeatherPoller(): void {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
    console.log("⏹️ Weather poller stopped");
  }
}