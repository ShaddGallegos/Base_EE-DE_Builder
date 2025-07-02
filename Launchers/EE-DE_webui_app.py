#!/usr/bin/env python3
"""
Builder WebUI Desktop App
A simple GUI launcher for the Builder Web UI
"""

import tkinter as tk
from tkinter import messagebox, ttk
import subprocess
import webbrowser
import threading
import requests
import time
import sys
import os

# Suppress fontconfig warnings and other GUI-related warnings
import warnings
warnings.filterwarnings("ignore", category=UserWarning)

# Set environment variables to suppress fontconfig errors
os.environ['FONTCONFIG_FILE'] = '/dev/null'
os.environ['FONTCONFIG_PATH'] = '/usr/share/fontconfig'

# Redirect stderr temporarily to suppress fontconfig warnings during tkinter import
import io
import contextlib

@contextlib.contextmanager
def suppress_stderr():
    with open(os.devnull, "w") as devnull:
        old_stderr = sys.stderr
        sys.stderr = devnull
        try:
            yield
        finally:
            sys.stderr = old_stderr

class BuilderWebUIApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Builder WebUI Launcher")
        self.root.geometry("500x320")
        self.root.resizable(False, False)
        
        # Set icon if available
        try:
            self.root.iconbitmap("icon.ico")  # You can add an icon file
        except:
            pass
        
        self.url = "http://localhost:3000"
        self.setup_ui()
        self.check_service_status()
    
    def setup_ui(self):
        # Main frame
        main_frame = ttk.Frame(self.root, padding="20")
        main_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # Title
        title_label = ttk.Label(main_frame, text="Builder WebUI Launcher", 
                               font=("Arial", 16, "bold"))
        title_label.grid(row=0, column=0, columnspan=2, pady=(0, 20))
        
        # Status
        self.status_label = ttk.Label(main_frame, text="Checking service status...")
        self.status_label.grid(row=1, column=0, columnspan=2, pady=(0, 10))
        
        # Progress bar
        self.progress = ttk.Progressbar(main_frame, mode='indeterminate')
        self.progress.grid(row=2, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=(0, 20))
        
        # Buttons frame
        buttons_frame = ttk.Frame(main_frame)
        buttons_frame.grid(row=3, column=0, columnspan=2, pady=(0, 20))
        
        # Launch button
        self.launch_btn = ttk.Button(buttons_frame, text="Launch WebUI", 
                                    command=self.launch_webui, state="disabled")
        self.launch_btn.pack(side=tk.LEFT, padx=(0, 10))
        
        # Refresh button
        self.refresh_btn = ttk.Button(buttons_frame, text="Refresh Status", 
                                     command=self.check_service_status)
        self.refresh_btn.pack(side=tk.LEFT, padx=(0, 10))
        
        # Stop service and exit button
        self.stop_exit_btn = ttk.Button(buttons_frame, text="Stop Service & Exit", 
                                       command=self.stop_service_and_exit)
        self.stop_exit_btn.pack(side=tk.LEFT, padx=(0, 10))
        
        # Regular exit button
        self.exit_btn = ttk.Button(buttons_frame, text="Exit", 
                                  command=self.exit_app)
        self.exit_btn.pack(side=tk.LEFT)
        
        # URL entry
        url_frame = ttk.Frame(main_frame)
        url_frame.grid(row=4, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=(0, 10))
        
        ttk.Label(url_frame, text="URL:").pack(side=tk.LEFT)
        self.url_var = tk.StringVar(value=self.url)
        self.url_entry = ttk.Entry(url_frame, textvariable=self.url_var)
        self.url_entry.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(10, 0))
        
        # Instructions
        instructions = ttk.Label(main_frame, 
                                text="Make sure your Builder WebUI service is running\nbefore launching the application.",
                                justify=tk.CENTER, foreground="gray")
        instructions.grid(row=5, column=0, columnspan=2, pady=(20, 0))
        
        # Configure grid weights
        self.root.columnconfigure(0, weight=1)
        self.root.rowconfigure(0, weight=1)
        main_frame.columnconfigure(0, weight=1)
    
    def check_service_status(self):
        """Check if the service is running on the specified URL"""
        self.progress.start()
        self.status_label.config(text="Checking service status...")
        self.launch_btn.config(state="disabled")
        self.refresh_btn.config(state="disabled")
        
        # Run check in separate thread
        threading.Thread(target=self._check_service_thread, daemon=True).start()
    
    def _check_service_thread(self):
        """Thread function to check service status"""
        try:
            current_url = self.url_var.get()
            response = requests.get(current_url, timeout=3)
            if response.status_code == 200:
                self.root.after(0, self._service_available)
            else:
                self.root.after(0, self._service_unavailable)
        except requests.exceptions.RequestException:
            self.root.after(0, self._service_unavailable)
    
    def _service_available(self):
        """Called when service is available"""
        self.progress.stop()
        self.status_label.config(text="✓ Service is running", foreground="green")
        self.launch_btn.config(state="normal")
        self.refresh_btn.config(state="normal")
    
    def _service_unavailable(self):
        """Called when service is not available"""
        self.progress.stop()
        self.status_label.config(text="✗ Service not available", foreground="red")
        self.launch_btn.config(state="disabled")
        self.refresh_btn.config(state="normal")
    
    def launch_webui(self):
        """Launch the WebUI in the default browser"""
        try:
            self.url = self.url_var.get()
            webbrowser.open(self.url)
            messagebox.showinfo("Success", f"WebUI opened in your default browser!\nURL: {self.url}")
        except Exception as e:
            messagebox.showerror("Error", f"Failed to open WebUI: {str(e)}")

    def exit_app(self):
        """Exit the application without stopping the service"""
        result = messagebox.askyesno(
            "Exit Application", 
            "Exit the application?\n\n(The service will continue running)"
        )
        if result:
            self.root.quit()
            self.root.destroy()

    def stop_service_and_exit(self):
        """Stop the service and exit the application"""
        try:
            current_url = self.url_var.get()
            # Extract port from URL
            if ":" in current_url:
                port = current_url.split(":")[-1].rstrip("/")
            else:
                port = "3000"  # default port
            
            # Confirm with user
            result = messagebox.askyesno(
                "Stop Service", 
                f"This will attempt to stop the service running on port {port}.\n\n"
                "Are you sure you want to continue?"
            )
            
            if result:
                self.status_label.config(text="Stopping service...", foreground="orange")
                self.root.update()
                
                # Try different methods to stop the service
                stopped = False
                
                # Method 1: Find and kill process using the port
                try:
                    # Use lsof to find processes using the port
                    result = subprocess.run(
                        ["lsof", "-ti", f":{port}"], 
                        capture_output=True, 
                        text=True, 
                        timeout=5
                    )
                    
                    if result.returncode == 0 and result.stdout.strip():
                        pids = result.stdout.strip().split('\n')
                        for pid in pids:
                            if pid.strip():
                                subprocess.run(["kill", pid.strip()], timeout=5)
                                stopped = True
                                break
                except (subprocess.TimeoutExpired, subprocess.CalledProcessError, FileNotFoundError):
                    pass
                
                # Method 2: Try to find common service processes
                if not stopped:
                    try:
                        # Look for common web server processes
                        common_processes = ["node", "npm", "yarn", "python", "gunicorn", "uvicorn"]
                        for proc in common_processes:
                            result = subprocess.run(
                                ["pkill", "-f", f"{proc}.*{port}"],
                                capture_output=True,
                                timeout=5
                            )
                            if result.returncode == 0:
                                stopped = True
                                break
                    except (subprocess.TimeoutExpired, subprocess.CalledProcessError):
                        pass
                
                # Method 3: Try netstat approach
                if not stopped:
                    try:
                        result = subprocess.run(
                            ["netstat", "-tlnp", f"| grep :{port}"],
                            shell=True,
                            capture_output=True,
                            text=True,
                            timeout=5
                        )
                        if result.stdout:
                            # Extract PID from netstat output
                            import re
                            pid_match = re.search(r'(\d+)/', result.stdout)
                            if pid_match:
                                pid = pid_match.group(1)
                                subprocess.run(["kill", pid], timeout=5)
                                stopped = True
                    except (subprocess.TimeoutExpired, subprocess.CalledProcessError):
                        pass
                
                # Wait a moment and check if service stopped
                time.sleep(1)
                
                if stopped:
                    messagebox.showinfo("Success", f"Service on port {port} has been stopped.")
                else:
                    messagebox.showwarning(
                        "Warning", 
                        f"Could not automatically stop the service on port {port}.\n"
                        "You may need to stop it manually."
                    )
                
                # Close the application
                self.root.quit()
                self.root.destroy()
                
        except Exception as e:
            messagebox.showerror("Error", f"Failed to stop service: {str(e)}")
            # Still close the application even if stopping service failed
            self.root.quit()
            self.root.destroy()

def main():
    # Suppress fontconfig and other GUI warnings during initialization
    with suppress_stderr():
        root = tk.Tk()
    
    # Set additional properties to avoid font issues
    try:
        root.tk.call('tk', 'scaling', 1.0)
    except:
        pass
    
    app = BuilderWebUIApp(root)
    
    try:
        root.mainloop()
    except KeyboardInterrupt:
        root.quit()
        root.destroy()
    except Exception as e:
        print(f"Application error: {e}")
        try:
            root.quit()
            root.destroy()
        except:
            pass

if __name__ == "__main__":
    main()
