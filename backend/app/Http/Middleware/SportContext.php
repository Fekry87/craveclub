<?php

namespace App\Http\Middleware;

use App\Models\SportModule;
use Closure;
use Illuminate\Http\Request;

class SportContext
{
    public function handle(Request $request, Closure $next)
    {
        $identifier = $request->route('sportSlug')
            ?? $request->route('sport')
            ?? $request->header('X-Sport-Module')
            ?? $request->input('sport_module_id');

        if ($identifier) {
            $clubId = app('current_club_id');
            $sportModule = $this->resolveFromClub($identifier, $clubId);

            if (! $sportModule) {
                abort(404, 'Sport module not found');
            }

            app()->instance('current_sport_module_id', $sportModule->id);
        }

        return $next($request);
    }

    private function resolveFromClub(string|int $identifier, int $clubId): ?SportModule
    {
        return SportModule::where(function ($q) use ($identifier) {
            $q->where('slug', $identifier)->orWhere('id', $identifier);
        })
            ->whereHas('clubs', function ($q) use ($clubId) {
                $q->where('clubs.id', $clubId)
                    ->where('club_sport_modules.is_active', true);
            })
            ->first();
    }
}
