<?php

namespace App\Exceptions;

use RuntimeException;

class WhatsAppProviderException extends RuntimeException
{
    public function __construct(
        string $message,
        public readonly bool $fallbackSafe = true,
    ) {
        parent::__construct($message);
    }
}
