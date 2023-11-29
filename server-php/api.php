<?php

require 'vendor/autoload.php'; // Make sure to include the path to your php-jwt library

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

$jwtKey = "";
$avatarDir = "/path/to/avatars/storage/dir/";

// Enable CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Validate JWT Token
function validateToken($token, $jwtKey)
{
    try {
        $decoded = JWT::decode($token, new Key($jwtKey, 'HS256'));

        if (empty($decoded->account)) {
            return false;
        }

        return $decoded->account;
    } catch (Exception $e) {
        return false;
    }
}

// Handle OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Handle POST request
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $headers = getallheaders();

    if (!isset($headers['authorization'])) {
        http_response_code(401);
        die("Token not provided");
    }

    $token = $headers['authorization'];

    // Validate JWT token
    $account = validateToken($token, $jwtKey);

    if (!$account) {
        http_response_code(401);
        die("Invalid token or missing 'account' in token");
    }

    // Check if an image is uploaded
    if (!isset($_FILES['image'])) {
        http_response_code(400);
        die("No image file uploaded");
    }

    $image = $_FILES['image'];

    // Resize image using ImageMagick
    $img = new \Imagick($image['tmp_name']);
    $img->cropThumbnailImage(200, 200);
    $img->setImageFormat("png");

    // Save the resized image to a predefined directory
    $filename = strtolower($account) . ".png";
    try {
        if (!$img->writeImage($avatarDir . $filename)) {
            throw new Exception();
        }
    } catch (Exception $e) {
        http_response_code(500);
        die("Failed to write image file");
    }

    http_response_code(200);
    echo "Image uploaded and resized successfully";
} else {
    http_response_code(405);
    echo "Method Not Allowed";
}

?>
