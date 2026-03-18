<?php

if (! function_exists('current_sport_module_id')) {
    function current_sport_module_id(): ?int
    {
        return app()->has('current_sport_module_id')
            ? app('current_sport_module_id')
            : null;
    }
}
