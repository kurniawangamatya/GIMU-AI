import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  increment, 
  serverTimestamp,
  onSnapshot,
  runTransaction
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

interface UserData {
  uid: string;
  email: string | null;
  credits: number;
  lastRenewalMonth?: string;
  redeemedCodes?: string[];
  lastRedeemedToken?: string | null;
}

interface AuthContextType {
  user: FirebaseUser | null;
  userData: UserData | null;
  isAdmin: boolean;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  deductCredit: (cost: number) => Promise<boolean>;
  redeemToken: (token: string) => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // Check if user is admin (doc exists OR hardcoded bootstrap emails)
        const isAdminEmail = 
          currentUser.email === 'kurniawangamatya37@gmail.com' || 
          currentUser.email === 'kurniawangamatya@gmail.com';
        const adminDocRef = doc(db, 'admins', currentUser.uid);
        
        try {
          const adminDoc = await getDoc(adminDocRef);
          
          // If they are the bootstrap admin but no doc exists, create it
          if (isAdminEmail && !adminDoc.exists()) {
            await setDoc(adminDocRef, {
              email: currentUser.email,
              role: 'super-admin',
              bootstrapped: true
            });
          }
          setIsAdmin(adminDoc.exists() || isAdminEmail);
        } catch (e) {
          console.error("Admin check failed", e);
          setIsAdmin(isAdminEmail); // Fallback to email check
        }

        // Initial signup - give 5 free credits
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${now.getMonth() + 1}`;

        // Initialize or fetch user data
        const userDocRef = doc(db, 'users', currentUser.uid);

        // Use onSnapshot for real-time credit updates
        const unsubscribeDoc = onSnapshot(userDocRef, async (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data() as UserData;
            
            // Check for monthly renewal
            if (data.lastRenewalMonth !== currentMonth) {
              try {
                const updateData: any = {
                  lastRenewalMonth: currentMonth,
                  updatedAt: serverTimestamp()
                };

                // Only top up to 3 if user has less than 3 tokens
                if ((data.credits || 0) < 3) {
                  updateData.credits = 3;
                }

                await updateDoc(userDocRef, updateData);
              } catch (e) {
                console.error("Renewal failed", e);
              }
            }
            
            setUserData(data);
          } else {
            console.log("Creating new user doc...");
            // Initial signup - give 5 free credits
            try {
              const newData = {
                uid: currentUser.uid,
                email: currentUser.email,
                credits: 5,
                lastRenewalMonth: currentMonth,
                lastRedeemedToken: "",
                redeemedCodes: [],
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              };
              await setDoc(userDocRef, newData);
              setUserData(newData as any);
            } catch (e) {
              console.error("User creation failed", e);
            }
          }
        }, (error) => {
          console.error("User snapshot error", error);
        });

        return () => unsubscribeDoc();
      } else {
        setUserData(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  const login = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      if (error.code === 'auth/cancelled-popup-request') {
        console.warn("Login cancelled or interrupted");
      } else {
        console.error("Login failed", error);
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setIsAdmin(false);
  };

  const deductCredit = async (cost: number): Promise<boolean> => {
    if (!user || !userData) return false;
    if (userData.credits < cost && !isAdmin) return false;

    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        credits: increment(-cost),
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error("Failed to deduct credit", error);
      return false;
    }
  };

  const redeemToken = async (token: string): Promise<{ success: boolean; message: string }> => {
    if (!user || !userData) return { success: false, message: 'Please sign in first' };
    
    // Normalize token
    const normalizedToken = token.trim().toUpperCase();

    // Special Case: GIMUDENTALCARE
    if (normalizedToken === 'GIMUDENTALCARE') {
      if (userData.redeemedCodes?.includes(normalizedToken)) {
        return { success: false, message: 'You have already redeemed this code.' };
      }

      try {
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, {
          credits: increment(10),
          lastRedeemedToken: normalizedToken,
          redeemedCodes: [...(userData.redeemedCodes || []), normalizedToken],
          updatedAt: serverTimestamp()
        });
        return { success: true, message: 'Successfully added 10 free credits! Enjoy!' };
      } catch (error) {
        console.error("Special code redemption failed", error);
        return { success: false, message: 'Failed to redeem code. Please try again.' };
      }
    }
    
    try {
      const result = await runTransaction(db, async (transaction) => {
        const tokenDocRef = doc(db, 'licenseKeys', token);
        const tokenDoc = await transaction.get(tokenDocRef);

        if (!tokenDoc.exists()) {
          return { success: false, message: 'Invalid token' };
        }

        const tokenData = tokenDoc.data();
        if (tokenData.isUsed) {
          return { success: false, message: 'Token already used' };
        }

        const userDocRef = doc(db, 'users', user.uid);
        
        // Mark token as used
        transaction.update(tokenDocRef, {
          isUsed: true,
          usedBy: user.uid,
          usedAt: serverTimestamp()
        });

        // Add credits to user
        transaction.update(userDocRef, {
          credits: increment(tokenData.value),
          lastRedeemedToken: token,
          redeemedCodes: [...(userData.redeemedCodes || []), token],
          updatedAt: serverTimestamp()
        });

        return { success: true, message: `Successfully added ${tokenData.value} credits!` };
      });

      return result;
    } catch (error) {
      console.error("Redemption failed", error);
      return { success: false, message: 'Redemption failed. Please try again.' };
    }
  };

  return (
    <AuthContext.Provider value={{ user, userData, isAdmin, loading, login, logout, deductCredit, redeemToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
