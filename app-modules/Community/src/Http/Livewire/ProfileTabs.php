<?php

declare(strict_types=1);

namespace MinhaCidade\Community\Http\Livewire;

use Livewire\Component;
use Livewire\WithPagination;
use MinhaCidade\Identity\Models\User;

class ProfileTabs extends Component
{
    use WithPagination;

    public User $user;
    public string $activeTab = 'publications';

    public function mount(User $user): void
    {
        $this->user = $user;
    }

    public function switchTab(string $tab): void
    {
        $this->activeTab = $tab;
        $this->resetPage();
    }

    public function render()
    {
        $publications = collect();
        $events       = collect();
        $causes       = collect();

        if ($this->activeTab === 'publications') {
            $publications = $this->user
                ->publications()
                ->latest()
                ->paginate(10);
        }

        if ($this->activeTab === 'events') {
            $events = $this->user
                ->createdEvents()
                ->latest()
                ->paginate(10);
        }

        if ($this->activeTab === 'causes') {
            $causes = $this->user
                ->supportedPublications()
                ->latest()
                ->paginate(10);
        }

        return view('livewire.profile-tabs', compact('publications', 'events', 'causes'));
    }
}
