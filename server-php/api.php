<?php

require 'vendor/autoload.php';

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

const JWT_ALGORITHM = 'HS256';
const THUMBNAIL_LARGE = 200;
const THUMBNAIL_SMALL = 80;

const JWT_KEY = 'your_secret_key';
const AVATAR_DIR = '/path/to/avatars/storage/dir/';
const ALLOWED_DOMAINS = [
    'http://example.com',
    'https://subdomain.example.com',
    'https://*.example.com',
];

// Check directories
if (!is_dir(AVATAR_DIR) || !is_writable(AVATAR_DIR)) {
    http_response_code(500);
    error_log('Avatar directory is not writable. ["' . AVATAR_DIR . '"]');
    die("Error: Avatar directory is not writable.");
}

const SMALL_DIR = AVATAR_DIR . 'small/';
checkDirectory(SMALL_DIR);

const LARGE_DIR = AVATAR_DIR . 'large/';
checkDirectory(LARGE_DIR);

// Enable CORS
$requestOrigin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (isAllowedDomain($requestOrigin)) {
    header("Access-Control-Allow-Origin: $requestOrigin");
} else {
    http_response_code(403);
    exit();
}

header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Handle OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Handle POST request
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $token = $_SERVER['HTTP_AUTHORIZATION'];

    if (!isset($token)) {
        http_response_code(401);
        error_log('Token not provided.');
        die('Error: Token not provided.');
    }

    // Validate JWT token
    $account = validateToken($token);

    if (!$account) {
        http_response_code(401);
        error_log('Token missing \'account\' property.');
        die('Error: Token missing \'account\' property.');
    }

    $file = $_FILES['image'];
    // Check if an image is uploaded
    if (!isset($file)) {
        http_response_code(400);
        error_log('No file uploaded.');
        die("Error: No file uploaded.");
    }

    if ($file['error'] !== UPLOAD_ERR_OK) {
        switch ($file['error']) {
            case UPLOAD_ERR_INI_SIZE:
                $errorMessage = 'The uploaded file exceeds the maximum file size allowed by the server.';
                break;
            case UPLOAD_ERR_FORM_SIZE:
                $errorMessage = 'The uploaded file exceeds the maximum file size allowed by the form.';
                break;
            case UPLOAD_ERR_PARTIAL:
                $errorMessage = 'The uploaded file was only partially uploaded.';
                break;
            case UPLOAD_ERR_NO_FILE:
                $errorMessage = 'No file was uploaded.';
                break;
            case UPLOAD_ERR_NO_TMP_DIR:
                $errorMessage = 'Missing temporary folder.';
                break;
            case UPLOAD_ERR_CANT_WRITE:
                $errorMessage = 'Failed to write file to disk.';
                break;
            case UPLOAD_ERR_EXTENSION:
                $errorMessage = 'A PHP extension stopped the file upload.';
                break;
            default:
                $errorMessage = 'Unknown error occurred.';
                break;
        }
        error_log("File upload failed: $errorMessage");
        die("Error: File upload failed.");
    }

    $fileType = $file['type'];
    if (strpos($fileType, 'image') !== 0) {
        http_response_code(400);
        error_log("File was not an image type. [\"$fileType\"]");
        die("Error: File was not an image type.");
    }

    try {
        $filename = strtolower($account) . ".png";

        // Resize image using ImageMagick
        $img = new \Imagick($file['tmp_name']);

        $imgLarge = $img->clone();
        $imgLarge->cropThumbnailImage(THUMBNAIL_LARGE, THUMBNAIL_LARGE);
        $imgLarge->setImagePage(0, 0, 0, 0);
        $imgLarge->setImageFormat("png");
        $imgLarge->writeImage(LARGE_DIR . $filename);

        $imgSmall = $img->clone();
        $imgSmall->cropThumbnailImage(THUMBNAIL_SMALL, THUMBNAIL_SMALL);
        $imgSmall->setImagePage(0, 0, 0, 0);
        $imgSmall->setImageFormat("png");
        $imgSmall->writeImage(SMALL_DIR . $filename);
    } catch (Exception $e) {
        http_response_code(500);
        error_log('Failed to create thumbnails: ' . $e->getMessage());
        die('Error: Failed to create thumbnails');
    }

    http_response_code(200);
    echo "Image uploaded and resized successfully";
} else {
    http_response_code(405);
    echo "Method Not Allowed";
}

function checkDirectory($dir) {
    if (is_dir($dir)) {
        return;
    }
    if (!mkdir($dir, 0777)) {
        http_response_code(500);
        error_log("Unable to create avatar subdirectory. [\"$dir\"]");
        die('Error: Unable to create avatar subdirectory.');
    }
    if (!is_writable($dir)) {
        http_response_code(500);
        error_log("Avatar subdirectory is not writeable. [\"$dir\"]");
        die('Avatar subdirectory is not writeable.');
    }
}

function isAllowedDomain($domain) {
    foreach (ALLOWED_DOMAINS as $allowed) {
        $regex = '/^' . str_replace('\*', '.+?', preg_quote($allowed, '/')) . '$/';
        if (preg_match($regex, $domain)) {
            return true;
        }
    }
    return false;
}

function validateToken($token) {
    try {
        $decoded = JWT::decode($token, new Key(JWT_KEY, JWT_ALGORITHM));

        if (empty($decoded->account)) {
            return false;
        }

        return $decoded->account;
    } catch (Exception $e) {
        http_response_code(401);
        error_log('Error: Failed to decode token: ' . $e->getMessage());
        die('Error: Failed to decode token.');
        return false;
    }
}
