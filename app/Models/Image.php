<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Image extends Model
{
    protected $fillable = [
        'filename',
        'original_name',
        'path',
        'mime_type',
        'size',
        'watermark_type',
        'watermark_data',
        'watermark_signature',
    ];
}
