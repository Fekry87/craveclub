<?php

namespace App\Logging;

use Illuminate\Log\Logger;
use Monolog\Formatter\JsonFormatter;
use Monolog\LogRecord;
use Monolog\Processor\ProcessorInterface;

class AddRequestContext
{
    public function __invoke(Logger $logger): void
    {
        $monolog = $logger->getLogger();

        // Set JSON formatter on all handlers
        foreach ($monolog->getHandlers() as $handler) {
            $handler->setFormatter(new JsonFormatter());
        }

        // Add request context to every log entry
        $monolog->pushProcessor(new class implements ProcessorInterface {
            public function __invoke(LogRecord $record): LogRecord
            {
                return $record->with(extra: array_merge($record->extra, [
                    'request_id'  => app()->has('request_id') ? app('request_id') : null,
                    'club_id'     => app()->has('current_club_id') ? app('current_club_id') : null,
                    'environment' => app()->environment(),
                ]));
            }
        });
    }
}
