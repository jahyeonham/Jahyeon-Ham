/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Header } from './components/Header';
import { Intro } from './components/Intro';
import { WorkGrid } from './components/WorkGrid';
import { DigitalGrid } from './components/DigitalGrid';
import { PersonalGrid } from './components/PersonalGrid';
import { AboutMe } from './components/AboutMe';
import { ContactFooter } from './components/ContactFooter';
import { CaseStudyView } from './components/CaseStudyView';
import { ContactModal } from './components/ContactModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { ProjectEditModal } from './components/ProjectEditModal';
import { AboutEditModal } from './components/AboutEditModal';
import { AdminBar } from './components/AdminBar';
import { ExportModal } from './components/ExportModal';
import { ThumbnailCropModal } from './components/ThumbnailCropModal';
import { ContactLinksEditModal } from './components/ContactLinksEditModal';
import {
  PRODUCER_WORKS,
  DIGITAL_WORKS,
  PERSONAL_WORKS,
  DEFAULT_ABOUT_DATA,
  DEFAULT_CONTACT_LINKS,
} from './data/portfolioData';
import { Project, AboutData, ContactLinksData } from './types';
import { extractYouTubeId, getYouTubeThumbnail } from './utils';
import { deleteVideoFromStorage } from './videoStorage';
import {
  STORAGE_KEYS,
  getInitialDataFromLocalStorage,
  persistDataReliably,
  clearAllPortfolioStorage,
  getItemFromIndexedDB,
} from './storageManager';

export default function App() {
  // --- Admin State ---
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(STORAGE_KEYS.IS_ADMIN) === 'true';
    } catch {
      return false;
    }
  });

  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [storageToast, setStorageToast] = useState<string | null>(null);

  // --- Portfolio Content States (with Dual-tier IndexedDB + localStorage sync) ---
  const [producerWorks, setProducerWorks] = useState<Project[]>(() => {
    return getInitialDataFromLocalStorage(STORAGE_KEYS.PRODUCER_WORKS, PRODUCER_WORKS);
  });

  const [digitalWorks, setDigitalWorks] = useState<Project[]>(() => {
    return getInitialDataFromLocalStorage(STORAGE_KEYS.DIGITAL_WORKS, DIGITAL_WORKS);
  });

  const [personalWorks, setPersonalWorks] = useState<Project[]>(() => {
    return getInitialDataFromLocalStorage(STORAGE_KEYS.PERSONAL_WORKS, PERSONAL_WORKS);
  });

  const [aboutData, setAboutData] = useState<AboutData>(() => {
    return getInitialDataFromLocalStorage(STORAGE_KEYS.ABOUT_DATA, DEFAULT_ABOUT_DATA);
  });

  const [contactLinks, setContactLinks] = useState<ContactLinksData>(() => {
    return getInitialDataFromLocalStorage(STORAGE_KEYS.CONTACT_LINKS, DEFAULT_CONTACT_LINKS);
  });

  // Hydrate authoritative state from IndexedDB on startup (handles large images & quota bypass)
  useEffect(() => {
    let isMounted = true;
    async function hydrateFromIndexedDB() {
      try {
        const [idbProducer, idbDigital, idbPersonal, idbAbout, idbContact] = await Promise.all([
          getItemFromIndexedDB<Project[]>(STORAGE_KEYS.PRODUCER_WORKS),
          getItemFromIndexedDB<Project[]>(STORAGE_KEYS.DIGITAL_WORKS),
          getItemFromIndexedDB<Project[]>(STORAGE_KEYS.PERSONAL_WORKS),
          getItemFromIndexedDB<AboutData>(STORAGE_KEYS.ABOUT_DATA),
          getItemFromIndexedDB<ContactLinksData>(STORAGE_KEYS.CONTACT_LINKS),
        ]);

        if (!isMounted) return;

        if (idbProducer && Array.isArray(idbProducer) && idbProducer.length > 0) {
          setProducerWorks(idbProducer.filter(Boolean));
        }
        if (idbDigital && Array.isArray(idbDigital) && idbDigital.length > 0) {
          setDigitalWorks(idbDigital.filter(Boolean));
        }
        if (idbPersonal && Array.isArray(idbPersonal) && idbPersonal.length > 0) {
          setPersonalWorks(idbPersonal.filter(Boolean));
        }
        if (idbAbout && idbAbout.greeting) {
          setAboutData(idbAbout);
        }
        if (idbContact && idbContact.email) {
          setContactLinks(idbContact);
        }
      } catch (err) {
        console.warn('[App] Failed to hydrate from IndexedDB:', err);
      }
    }
    hydrateFromIndexedDB();
    return () => {
      isMounted = false;
    };
  }, []);

  // Combined projects for lookup & Prev/Next navigation
  const allProjects = useMemo(() => {
    return [...producerWorks, ...digitalWorks, ...personalWorks];
  }, [producerWorks, digitalWorks, personalWorks]);

  // Selected project for Case Study view
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState<boolean>(false);

  // Project Edit Modal State
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isProjectEditOpen, setIsProjectEditOpen] = useState<boolean>(false);
  const [defaultIsDigitalForNew, setDefaultIsDigitalForNew] = useState<boolean>(false);
  const [defaultIsPersonalForNew, setDefaultIsPersonalForNew] = useState<boolean>(false);

  // About Me Edit Modal State
  const [isAboutEditOpen, setIsAboutEditOpen] = useState<boolean>(false);

  // Contact & Social Links Edit Modal State
  const [isContactLinksEditOpen, setIsContactLinksEditOpen] = useState<boolean>(false);

  // Thumbnail Crop / Focus Modal State
  const [cropTargetProject, setCropTargetProject] = useState<Project | null>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState<boolean>(false);

  // Sync with URL hash for easy sharing and browser history navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        const found = allProjects.find((p) => p.id === hash);
        if (found) {
          setSelectedProject(found);
          return;
        }
      }
      setSelectedProject(null);
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [allProjects]);

  // Update selectedProject if its data changes in state
  useEffect(() => {
    if (selectedProject) {
      const updated = allProjects.find((p) => p.id === selectedProject.id);
      if (updated) {
        setSelectedProject(updated);
      }
    }
  }, [allProjects, selectedProject]);

  const showToast = (msg: string) => {
    setStorageToast(msg);
    setTimeout(() => {
      setStorageToast((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  // Save to reliable dual-tier storage (IndexedDB + localStorage)
  const saveProducerWorks = (works: Project[]) => {
    const clean = works.filter(Boolean);
    setProducerWorks(clean);
    persistDataReliably(STORAGE_KEYS.PRODUCER_WORKS, clean);
  };

  const saveDigitalWorks = (works: Project[]) => {
    const clean = works.filter(Boolean);
    setDigitalWorks(clean);
    persistDataReliably(STORAGE_KEYS.DIGITAL_WORKS, clean);
  };

  const savePersonalWorks = (works: Project[]) => {
    const clean = works.filter(Boolean);
    setPersonalWorks(clean);
    persistDataReliably(STORAGE_KEYS.PERSONAL_WORKS, clean);
  };

  const saveAboutData = (data: AboutData) => {
    setAboutData(data);
    persistDataReliably(STORAGE_KEYS.ABOUT_DATA, data);
    showToast('소개글이 안전하게 저장되었습니다.');
  };

  const saveContactLinks = (data: ContactLinksData) => {
    setContactLinks(data);
    persistDataReliably(STORAGE_KEYS.CONTACT_LINKS, data);
    showToast('연락처 및 소셜 링크가 저장되었습니다.');
  };

  // --- Admin Login / Logout Handlers ---
  const handleAdminLoginSuccess = () => {
    setIsAdmin(true);
    try {
      sessionStorage.setItem(STORAGE_KEYS.IS_ADMIN, 'true');
    } catch {}
    showToast('관리자 모드로 로그인되었습니다.');
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    try {
      sessionStorage.removeItem(STORAGE_KEYS.IS_ADMIN);
    } catch {}
    showToast('관리자 모드가 종료되었습니다.');
  };

  // --- Reset All To Default Handler ---
  const handleResetToDefault = async () => {
    if (
      window.confirm(
        '초기 포트폴리오 데이터로 복원하시겠습니까? 지금까지 수정한 모든 내용이 초기화됩니다.'
      )
    ) {
      setProducerWorks(PRODUCER_WORKS);
      setDigitalWorks(DIGITAL_WORKS);
      setPersonalWorks(PERSONAL_WORKS);
      setAboutData(DEFAULT_ABOUT_DATA);
      setContactLinks(DEFAULT_CONTACT_LINKS);
      await clearAllPortfolioStorage();
      showToast('초기 기본 데이터로 복원되었습니다.');
    }
  };

  // --- Project Add / Edit / Delete Handlers ---
  const handleOpenAddProject = (isDigital = false, isPersonal = false) => {
    setEditingProject(null);
    setDefaultIsDigitalForNew(isDigital);
    setDefaultIsPersonalForNew(isPersonal);
    setIsProjectEditOpen(true);
  };

  const handleOpenEditProject = (project: Project) => {
    setEditingProject(project);
    setDefaultIsDigitalForNew(Boolean(project.isDigital));
    setDefaultIsPersonalForNew(Boolean(project.isPersonal));
    setIsProjectEditOpen(true);
  };

  const handleSaveProject = (savedProject: Project, isNew: boolean) => {
    // Determine target section
    const targetSection: 'personal' | 'digital' | 'producer' = savedProject.isPersonal
      ? 'personal'
      : savedProject.isDigital
      ? 'digital'
      : 'producer';

    // Remove from other sections so moving between sections never creates duplicates or loses the project
    const cleanProducer = producerWorks.filter((p) => p && p.id !== savedProject.id);
    const cleanDigital = digitalWorks.filter((p) => p && p.id !== savedProject.id);
    const cleanPersonal = personalWorks.filter((p) => p && p.id !== savedProject.id);

    let nextProducer = cleanProducer;
    let nextDigital = cleanDigital;
    let nextPersonal = cleanPersonal;

    const upsert = (currentList: Project[]) => {
      const idx = currentList.findIndex((p) => p && p.id === savedProject.id);
      if (idx >= 0) {
        const next = [...currentList];
        next[idx] = savedProject;
        return next;
      }
      return isNew ? [savedProject, ...currentList] : [...currentList, savedProject];
    };

    if (targetSection === 'personal') {
      nextPersonal = upsert(cleanPersonal);
    } else if (targetSection === 'digital') {
      nextDigital = upsert(cleanDigital);
    } else {
      nextProducer = upsert(cleanProducer);
    }

    saveProducerWorks(nextProducer);
    saveDigitalWorks(nextDigital);
    savePersonalWorks(nextPersonal);

    if (selectedProject && selectedProject.id === savedProject.id) {
      setSelectedProject(savedProject);
    }

    const sectionLabel =
      targetSection === 'personal'
        ? 'Personal Works'
        : targetSection === 'digital'
        ? 'Brand Content'
        : 'Broadcast Works';

    showToast(`"${savedProject.title}" 프로젝트가 ${sectionLabel}에 저장되었습니다.`);
  };

  const handleDeleteProject = (id: string) => {
    // Also clean up any large video stored in IndexedDB for this project
    deleteVideoFromStorage(id).catch(() => {});

    const newProducer = producerWorks.filter((p) => p.id !== id);
    const newDigital = digitalWorks.filter((p) => p.id !== id);
    const newPersonal = personalWorks.filter((p) => p.id !== id);

    if (newProducer.length !== producerWorks.length) {
      saveProducerWorks(newProducer);
    }
    if (newDigital.length !== digitalWorks.length) {
      saveDigitalWorks(newDigital);
    }
    if (newPersonal.length !== personalWorks.length) {
      savePersonalWorks(newPersonal);
    }

    if (selectedProject?.id === id) {
      handleBackToWork();
    }
  };

  const handleUpdateProjectVideo = (
    projectId: string,
    newVideoUrl: string,
    updateThumbnail: boolean = false
  ) => {
    const newYtId = extractYouTubeId(newVideoUrl);
    const newThumbnail =
      newYtId && updateThumbnail ? getYouTubeThumbnail(newYtId) : undefined;

    const isBlobUrl = newVideoUrl.startsWith('blob:');
    const sourceType = isBlobUrl ? 'uploaded' : newYtId ? 'youtube' : newVideoUrl ? 'direct_url' : undefined;

    const updateList = (list: Project[]) =>
      list.map((p) => {
        if (p.id !== projectId) return p;
        const updated: Project = {
          ...p,
          videoUrl: newVideoUrl.trim() || undefined,
          externalUrl: newVideoUrl.trim() || p.externalUrl,
          videoSourceType: sourceType,
        };
        if (newThumbnail) {
          updated.thumbnailUrl = newThumbnail;
          updated.backdropUrl = newThumbnail;
        }
        return updated;
      });

    const newProducer = updateList(producerWorks);
    const newDigital = updateList(digitalWorks);
    const newPersonal = updateList(personalWorks);

    saveProducerWorks(newProducer);
    saveDigitalWorks(newDigital);
    savePersonalWorks(newPersonal);

    const updatedCurrent = [...newProducer, ...newDigital, ...newPersonal].find(
      (p) => p.id === projectId
    );
    if (updatedCurrent) {
      setSelectedProject(updatedCurrent);
    }
  };

  const handleSaveThumbnailPosition = (projectId: string, newPosition: string) => {
    const updateList = (list: Project[]) =>
      list.map((p) => (p.id === projectId ? { ...p, thumbnailPosition: newPosition } : p));

    const newProducer = updateList(producerWorks);
    const newDigital = updateList(digitalWorks);
    const newPersonal = updateList(personalWorks);

    saveProducerWorks(newProducer);
    saveDigitalWorks(newDigital);
    savePersonalWorks(newPersonal);

    if (selectedProject && selectedProject.id === projectId) {
      setSelectedProject((prev) => (prev ? { ...prev, thumbnailPosition: newPosition } : null));
    }
  };

  const handleMoveProject = (
    section: 'producer' | 'digital' | 'personal',
    index: number,
    direction: 'up' | 'down'
  ) => {
    let list: Project[];
    if (section === 'producer') list = [...producerWorks];
    else if (section === 'digital') list = [...digitalWorks];
    else list = [...personalWorks];

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    if (section === 'producer') {
      saveProducerWorks(list);
    } else if (section === 'digital') {
      saveDigitalWorks(list);
    } else {
      savePersonalWorks(list);
    }
  };

  const handleSelectProject = (project: Project) => {
    window.location.hash = project.id;
    setSelectedProject(project);
  };

  const handleBackToWork = () => {
    window.location.hash = '';
    setSelectedProject(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#F8F8F7] text-[#1A1A1A] flex flex-col font-sans selection:bg-[#1A1A1A] selection:text-[#F8F8F7]">
      {/* Top Admin Sticky Bar when logged in */}
      {isAdmin && (
        <AdminBar
          onAddNewProject={handleOpenAddProject}
          onEditAbout={() => setIsAboutEditOpen(true)}
          onEditLinks={() => setIsContactLinksEditOpen(true)}
          onResetDefault={handleResetToDefault}
          onExportJson={() => setIsExportOpen(true)}
          onLogout={handleAdminLogout}
        />
      )}

      {/* Header */}
      <Header
        onContactClick={() => setIsContactModalOpen(true)}
        onHomeClick={handleBackToWork}
        linkedinUrl={contactLinks.linkedinUrl}
      />

      {/* Main Content: Case Study View or Home Portfolio */}
      <main className="flex-1">
        {selectedProject ? (
          <CaseStudyView
            project={selectedProject}
            onBack={handleBackToWork}
            onSelectProject={handleSelectProject}
            allProjects={allProjects}
            isAdmin={isAdmin}
            onEditProject={handleOpenEditProject}
            onCropProject={(proj) => {
              setCropTargetProject(proj);
              setIsCropModalOpen(true);
            }}
            onUpdateProjectVideo={handleUpdateProjectVideo}
            onRequestAdminLogin={() => setIsAdminLoginOpen(true)}
            onSaveProject={handleSaveProject}
          />
        ) : (
          <>
            {/* 02. INTRO */}
            <Intro />

            {/* 03 & 04. PRODUCER WORK GRID */}
            <WorkGrid
              projects={producerWorks}
              onSelectProject={handleSelectProject}
              isAdmin={isAdmin}
              onEditProject={handleOpenEditProject}
              onCropProject={(proj) => {
                setCropTargetProject(proj);
                setIsCropModalOpen(true);
              }}
              onDeleteProject={handleDeleteProject}
              onMoveProject={(index, dir) => handleMoveProject('producer', index, dir)}
              onAddNewProject={() => handleOpenAddProject(false)}
            />

            {/* 09. SELECTED DIGITAL WORKS */}
            <DigitalGrid
              projects={digitalWorks}
              onSelectProject={handleSelectProject}
              isAdmin={isAdmin}
              onEditProject={handleOpenEditProject}
              onCropProject={(proj) => {
                setCropTargetProject(proj);
                setIsCropModalOpen(true);
              }}
              onDeleteProject={handleDeleteProject}
              onMoveProject={(index, dir) => handleMoveProject('digital', index, dir)}
              onAddNewProject={() => handleOpenAddProject(true, false)}
            />

            {/* PERSONAL WORKS (PRODUCER와 DIGITAL 작업이 끝난 뒤, ABOUT ME 바로 앞에 배치) */}
            <PersonalGrid
              projects={personalWorks}
              onSelectProject={handleSelectProject}
              isAdmin={isAdmin}
              onEditProject={handleOpenEditProject}
              onCropProject={(proj) => {
                setCropTargetProject(proj);
                setIsCropModalOpen(true);
              }}
              onDeleteProject={handleDeleteProject}
              onMoveProject={(index, dir) => handleMoveProject('personal', index, dir)}
              onAddNewProject={() => handleOpenAddProject(false, true)}
            />

            {/* 10 & 11. ABOUT ME + BEHIND THE SCENES PHOTO */}
            <AboutMe
              onContactClick={() => setIsContactModalOpen(true)}
              aboutData={aboutData}
              isAdmin={isAdmin}
              onEditAbout={() => setIsAboutEditOpen(true)}
            />
          </>
        )}
      </main>

      {/* 12 & 13. FINAL SECTION & FOOTER */}
      <ContactFooter
        onContactClick={() => setIsContactModalOpen(true)}
        onAdminClick={() => {
          if (isAdmin) {
            handleAdminLogout();
          } else {
            setIsAdminLoginOpen(true);
          }
        }}
        isAdmin={isAdmin}
        contactLinks={contactLinks}
        onEditLinks={() => setIsContactLinksEditOpen(true)}
      />

      {/* Contact Overlay Modal */}
      <ContactModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        contactLinks={contactLinks}
        isAdmin={isAdmin}
        onEditLinks={() => setIsContactLinksEditOpen(true)}
      />

      {/* Admin Login Modal (Password: 0115) */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onLoginSuccess={handleAdminLoginSuccess}
      />

      {/* Project Edit / Add Modal */}
      <ProjectEditModal
        isOpen={isProjectEditOpen}
        onClose={() => setIsProjectEditOpen(false)}
        onSave={handleSaveProject}
        initialProject={editingProject}
        defaultIsDigital={defaultIsDigitalForNew}
        defaultIsPersonal={defaultIsPersonalForNew}
      />

      {/* About Me Edit Modal */}
      <AboutEditModal
        isOpen={isAboutEditOpen}
        onClose={() => setIsAboutEditOpen(false)}
        onSave={saveAboutData}
        initialData={aboutData}
      />

      {/* Contact & Social Links Edit Modal */}
      <ContactLinksEditModal
        isOpen={isContactLinksEditOpen}
        onClose={() => setIsContactLinksEditOpen(false)}
        contactLinks={contactLinks}
        onSave={saveContactLinks}
        onResetDefault={() => saveContactLinks(DEFAULT_CONTACT_LINKS)}
      />

      {/* Data Export / Backup Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        data={{
          producerWorks,
          digitalWorks,
          personalWorks,
          aboutData,
          contactLinks,
          exportedAt: new Date().toISOString(),
        }}
      />

      {/* Thumbnail Focal Point / Crop Modal */}
      <ThumbnailCropModal
        isOpen={isCropModalOpen}
        onClose={() => {
          setIsCropModalOpen(false);
          setCropTargetProject(null);
        }}
        project={cropTargetProject}
        onSave={handleSaveThumbnailPosition}
      />

      {/* Persistence Notification Toast */}
      {storageToast && (
        <div
          id="storage-persistence-toast"
          className="fixed bottom-6 right-6 z-50 bg-[#1A1A1A] text-white border border-white/20 shadow-2xl px-4 py-3 flex items-center gap-3 text-xs tracking-wide animate-fade-in max-w-sm"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{storageToast}</span>
        </div>
      )}
    </div>
  );
}
