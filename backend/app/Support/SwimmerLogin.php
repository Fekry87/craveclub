<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

/**
 * The shape of a swimmer's generated login address, in one place.
 *
 * Swimmers never see `swimmer_<phone>@club<N>.craveclubs.local`; they type their
 * phone number and the API maps it to that address. The mapping was copy-pasted
 * across login, approval and rejection, so a change in one spelling silently made
 * the others look up a different account. Everything that needs it calls here now.
 */
class SwimmerLogin
{
    private const DOMAIN_SUFFIX = '.craveclubs.local';

    /** Strip formatting so "0100 000 0000" and "+20100-000-0000" agree. */
    public static function digits(?string $phone): string
    {
        return preg_replace('/[^0-9]/', '', (string) $phone) ?? '';
    }

    /**
     * The canonical login address for a phone in a club. `$suffix` numbers the
     * collision variants approval creates when the same phone registers twice
     * (`swimmer_0100_1@…`, `swimmer_0100_2@…`).
     */
    public static function email(int $clubId, ?string $phone, ?int $suffix = null): string
    {
        $tail = $suffix === null ? '' : '_'.$suffix;

        return 'swimmer_'.self::digits($phone).$tail.'@club'.$clubId.self::DOMAIN_SUFFIX;
    }

    /**
     * Every account in the club whose login address was derived from this phone —
     * the canonical one plus any numbered collision variants.
     */
    public static function query(int $clubId, ?string $phone): Builder
    {
        $digits = self::digits($phone);

        return User::where('club_id', $clubId)
            ->where(function ($q) use ($digits, $clubId) {
                $q->where('email', self::email($clubId, $digits))
                    // Escape the underscore: unescaped it is a LIKE wildcard and would
                    // also match a different phone that happens to share a prefix.
                    ->orWhere('email', 'like', 'swimmer_'.$digits.'\_%@club'.$clubId.self::DOMAIN_SUFFIX);
            })
            ->orderBy('id');
    }

    /**
     * The account a phone number signs into: the oldest match, which is the one
     * `resolve()` has always returned and the only one reachable by phone.
     */
    public static function resolve(int $clubId, ?string $phone): ?User
    {
        $digits = self::digits($phone);

        return $digits === '' ? null : self::query($clubId, $digits)->first();
    }

    /** The phone digits a generated login address was built from, if it is one. */
    public static function phoneFromEmail(?string $email): ?string
    {
        if (! preg_match('/^swimmer_(\d+)(?:_\d+)?@club\d+'.preg_quote(self::DOMAIN_SUFFIX, '/').'$/', (string) $email, $m)) {
            return null;
        }

        return $m[1];
    }

    /**
     * Whether this account is the one its own phone number signs into.
     *
     * False when the club holds more than one account for the phone: phone login
     * reaches only the oldest, so credentials issued for any other one work with
     * the email address alone. Managers have to be told that, or they hand a
     * swimmer a password that looks broken.
     */
    public static function isReachableByPhone(User $user): bool
    {
        $phone = self::phoneFromEmail($user->email);

        if ($phone === null || $user->club_id === null) {
            return false;
        }

        return self::resolve($user->club_id, $phone)?->id === $user->id;
    }
}
