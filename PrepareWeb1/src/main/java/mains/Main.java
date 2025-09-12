package mains;

import com.fastcgi.*;

import java.util.LinkedHashMap;
import java.math.BigDecimal;
import java.math.RoundingMode;

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

                //String method = FCGIInterface.request.params.getProperty("REQUEST_METHOD");
                handleGetRequest();
            } catch (Exception e) {
                sendJsonError("Error");
            }
        }
    }

    private static void handleGetRequest() {
        String query = FCGIInterface.request.params.getProperty("QUERY_STRING");
        LinkedHashMap<String, String> params = parseQuery(query);

        if (!params.containsKey("x") || !params.containsKey("y") || !params.containsKey("r")) {
            sendJsonError("Missing x, y or r");
            return;
        }

        String yStr = params.get("y");
        if (yStr == null || yStr.length() > 8) {
            sendJsonError("Y не длиннеее 8 символов");
            return;
        }

        try {
            int x = Integer.parseInt(params.get("x"));
            BigDecimal yDecimal = new BigDecimal(yStr);
            BigDecimal rDecimal = new BigDecimal(params.get("r"));

            yDecimal = yDecimal.setScale(30, RoundingMode.HALF_UP);
            rDecimal = rDecimal.setScale(30, RoundingMode.HALF_UP);

            boolean hit = checkHit(x, yDecimal, rDecimal);

            System.out.println("Content-Type: application/json");
            System.out.println();
            System.out.println(resp(hit ? "HIT" : "MISS", params.get("x"), yStr, params.get("r")));
            System.out.flush();
        } catch (NumberFormatException e) {
            sendJsonError("Invalid number format");
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

    public static boolean checkHit(int x, BigDecimal y, BigDecimal r) {
        BigDecimal xDec = BigDecimal.valueOf(x);

        boolean inCircle = false;
        if (x <= 0 && y.compareTo(BigDecimal.ZERO) >= 0) {
            BigDecimal xSq = xDec.multiply(xDec);
            BigDecimal ySq = y.multiply(y);
            BigDecimal rSq = r.multiply(r);
            inCircle = xSq.add(ySq).compareTo(rSq) <= 0;
        }

        boolean inTriangle = false;
        if (x >= 0 && y.compareTo(BigDecimal.ZERO) >= 0) {
            inTriangle = xDec.add(y).compareTo(r) <= 0;
        }

        boolean inRectangle = false;
        if (x >= 0 && y.compareTo(BigDecimal.ZERO) <= 0) {
            BigDecimal halfR = r.divide(BigDecimal.valueOf(2), 10, RoundingMode.HALF_UP);
            BigDecimal negativeHalfR = halfR.negate();
            inRectangle = xDec.compareTo(r) <= 0 && y.compareTo(negativeHalfR) >= 0;
        }

        return inCircle || inTriangle || inRectangle;
    }

    private static String resp(String result, String x, String y, String r) {
        return String.format("{\"isShoot\": \"%s\", \"x\": %s, \"y\": %s, \"r\": %s}", result, x, y, r);
    }

    private static void sendJsonError(String message) {
        System.out.println("Content-Type: application/json");
        System.out.println();
        System.out.println(String.format("{\"error\": \"%s\"}", message));
        System.out.flush();
    }
}