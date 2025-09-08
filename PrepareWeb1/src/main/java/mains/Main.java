package mains;

import com.fastcgi.*;

import java.util.LinkedHashMap;

public class Main {
    public static void main(String[] args) {
        FCGIInterface fcgi = new FCGIInterface();
        while (true) {
            try {
                int result = fcgi.FCGIaccept();
                if (result < 0) {
                    Thread.sleep(100);
                    continue;
                }

                if (FCGIInterface.request == null) {
                    continue;
                }

                String method = FCGIInterface.request.params.getProperty("REQUEST_METHOD");
                if ("GET".equals(method)) {
                    handleGetRequest();
                } else {
                    sendJsonError("Only GET");
                }
            } catch (Exception e) {
                sendJsonError("Error");
            }
        }
    }

    private static void handleGetRequest() {
        String query = FCGIInterface.request.params.getProperty("QUERY_STRING");
        if (query == null || query.isEmpty()) {
            sendJsonError("No query");
            return;
        }
        LinkedHashMap<String, String> params = parseQuery(query);
        if (!params.containsKey("x") || !params.containsKey("y") || !params.containsKey("r")) {
            sendJsonError("Missing x, y or r");
            return;
        }
        try {
            int x = Integer.parseInt(params.get("x"));
            float y = Float.parseFloat(params.get("y"));
            double r = Double.parseDouble(params.get("r"));

            long startTime = System.nanoTime();
            boolean hit = checkHit(x, y, r);
            long time = (System.nanoTime() - startTime) / 1_000_000;

            System.out.println("Content-Type: application/json");
            System.out.println();
            System.out.println(resp(hit ? "OK" : "MISS", params.get("x"), params.get("y"), params.get("r"), time));
            System.out.flush();
        } catch (NumberFormatException e) {
            sendJsonError("Invalid number");
        }
    }

    private static LinkedHashMap<String, String> parseQuery(String query) {
        LinkedHashMap<String, String> map = new LinkedHashMap<>();
        for (String pair : query.split("&")) {
            String[] kv = pair.split("=", 2);
            if (kv.length == 2) {
                map.put(kv[0], kv[1]);
            }
        }
        return map;
    }

    public static boolean checkHit(double x, double y, double r) {
        boolean inCircle = (x <= 0) && (y >= 0) && (x * x + y * y <= r * r);
        boolean inTriangle = (x >= 0) && (y >= 0) && (x + y <= r);
        boolean inRectangle = (x >= 0) && (y <= 0) && (x <= r) && (y >= -r / 2.0);
        return inCircle || inTriangle || inRectangle;
    }

    private static String resp(String result, String x, String y, String r, long time) {
        return String.format("{\"isShoot\": \"%s\", \"x\": %s, \"y\": %s, \"r\": %s, \"time\": %d}",
                result, x, y, r, time);
    }

    private static void sendJsonError(String message) {
        System.out.println("Content-Type: application/json");
        System.out.println();
        System.out.println(String.format("{\"error\": \"%s\"}", message));
        System.out.flush();
    }
}