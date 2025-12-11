<?php
// Lokasi file: src/backend/helpers/EmailService.php

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// === LOAD PHPMailer ===
// Sesuaikan path berdasarkan struktur foldermu. Asumsi folder PhpMailer ada di .../backend/PhpMailer
require_once __DIR__ . '/../PhpMailer/PHPMailer.php';
require_once __DIR__ . '/../PhpMailer/SMTP.php';
require_once __DIR__ . '/../PhpMailer/Exception.php';

// Load konstanta dari config/app.php
if (!defined('SYSTEM_EMAIL_SENDER')) {
    require_once __DIR__ . '/../config/app.php';
}

class EmailService
{
    /**
     * Mengirim email notifikasi via SMTP Gmail (PHPMailer).
     */
    public static function sendApprovalNotification(string $recipientEmail, string $username, string $action): bool
    {
        if ($action === 'approved') {
            $subject = "✅ Akun SIMORA Anda Telah Disetujui!";
            $bodyHtml = self::getApprovedEmailTemplate($username);

        } elseif ($action === 'rejected') {
            $subject = "❌ Pendaftaran Akun SIMORA Anda Ditolak";
            $bodyHtml = self::getRejectedEmailTemplate($username);

        } else {
            error_log("Unknown email action: " . $action);
            return false;
        }

        
        $mail = new PHPMailer(true);

        try {
            // CONFIG SMTP
            $mail->isSMTP();
            $mail->Host = 'smtp.gmail.com';
            $mail->SMTPAuth = true;
            
            // Uncomment untuk debugging SMTP (hanya saat development)
            // $mail->SMTPDebug = 2;
            // $mail->Debugoutput = 'error_log';

            // === KREDENSIAL GMAIL ===
            // Username dan Password App HARUS SESUAI
            $mail->Username = 'dhinivadilas@gmail.com'; 
            $mail->Password = 'tvxawquovhwhtaej'; // App Password tanpa spasi

            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port = 587;
            $mail->CharSet = 'UTF-8';
            
            // Tambahan untuk koneksi yang lebih stabil
            $mail->SMTPOptions = [
                'ssl' => [
                    'verify_peer' => false,
                    'verify_peer_name' => false,
                    'allow_self_signed' => true
                ]
            ];

            // SET HEADER (setFrom HARUS SAMA dengan $mail->Username)
            $mail->setFrom(SYSTEM_EMAIL_SENDER, SYSTEM_SENDER_NAME);
            $mail->addAddress($recipientEmail);
            $mail->addReplyTo(SYSTEM_EMAIL_SENDER, SYSTEM_SENDER_NAME);

            $mail->isHTML(true);
            $mail->Subject = $subject;
            $mail->Body = $bodyHtml;
            $mail->AltBody = strip_tags($bodyHtml); // Plain text version

            $mail->send();
            error_log("📧 EMAIL SENT SUCCESSFULLY to " . $recipientEmail);
            return true;

        } catch (Exception $e) {
            // Catat error PHPMailer ke log server Anda
            error_log("❌ EMAIL FAILED to {$recipientEmail}: {$mail->ErrorInfo}");
            error_log("❌ Exception: " . $e->getMessage());
            return false;
        }
    }


    // --- TEMPLATE EMAIL ---

    /**
     * Template Email Approved
     */
    private static function getApprovedEmailTemplate(string $username): string
    {
        $loginUrl = LOGIN_PAGE_URL;
        return "
             <div style='font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px;'>
                 <h2 style='color: #01A29D;'>Selamat, {$username}!</h2>
                 <p>Akun Anda telah <strong>DISETUJUI</strong> oleh Administrator.</p>
                 <p>Anda sekarang dapat login ke sistem SIMORA.</p>
                 <a href='{$loginUrl}' style='display: inline-block; padding: 10px 15px; background: #01A29D; color: white; text-decoration: none; border-radius: 5px;'>Login Sekarang</a>
                 <br><br>
                 <small style='color: #666;'>Terima kasih - Tim SIMORA</small>
             </div>
        ";
    }

    /**
     * Template Email Rejected
     */
    private static function getRejectedEmailTemplate(string $username): string
    {
        return "
             <div style='font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px;'>
                 <h2 style='color: #F75B50;'>Halo, {$username}</h2>
                 <p>Mohon maaf, pendaftaran akun Anda telah <strong style='color: #F75B50;'>DITOLAK</strong> oleh Administrator.</p>
                 <p>Jika Anda merasa ini adalah kesalahan atau ingin mengajukan banding, silakan hubungi admin untuk informasi lebih lanjut.</p>
                 <p>Anda dapat mendaftar ulang dengan data yang lebih lengkap jika diperlukan.</p>
                 <br>
                 <small style='color: #666;'>Terima kasih atas pengertiannya - Tim SIMORA</small>
             </div>
        ";
    }
}