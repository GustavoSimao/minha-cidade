@php
    $config = match($type) {
        'problem' => ['label' => 'Problema', 'bg' => 'bg-red-50',    'text' => 'text-red-700',    'dot' => 'bg-red-500'],
        'idea'    => ['label' => 'Ideia',    'bg' => 'bg-blue-50',   'text' => 'text-blue-700',   'dot' => 'bg-blue-500'],
        'event'   => ['label' => 'Evento',   'bg' => 'bg-green-50',  'text' => 'text-green-700',  'dot' => 'bg-green-500'],
        default   => ['label' => 'Conteúdo', 'bg' => 'bg-gray-100',  'text' => 'text-gray-600',   'dot' => 'bg-gray-400'],
    };
@endphp
<span class="inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full {{ $config['bg'] }} {{ $config['text'] }}">
    <span class="w-1.5 h-1.5 rounded-full {{ $config['dot'] }}"></span>
    {{ $config['label'] }}
</span>