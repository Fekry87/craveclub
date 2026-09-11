<?php

namespace App\Support;

class TempPassword
{
    /**
     * Generate a mobile-friendly temporary password: all uppercase letters +
     * digits, no symbols, no case-mixing, and no ambiguous characters
     * (I/O/0/1). Easy to read aloud, type on any keyboard, and copy.
     * Example: "KMTP4739". Meant to be changed on first login.
     */
    public static function generate(): string
    {
        $letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // no I, O
        $digits = '23456789';                  // no 0, 1

        $out = '';
        for ($i = 0; $i < 4; $i++) {
            $out .= $letters[random_int(0, strlen($letters) - 1)];
        }
        for ($i = 0; $i < 4; $i++) {
            $out .= $digits[random_int(0, strlen($digits) - 1)];
        }

        return $out;
    }
}
