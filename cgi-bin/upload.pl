#!/usr/local/bin/perl
# ============================================================
# upload.pl — File Upload/List/Delete CGI (Perl 5.8 Compatible)
# ============================================================

use strict;
use CGI;
use CGI::Cookie;
use File::Basename qw(dirname basename);
use POSIX ();

# Upload size: unlimited (server/quota limits apply)
$CGI::POST_MAX = -1;

my $COOKIE_NAME  = 'notepad_auth';
my $SECRET_TOKEN = 'notepad_secret_token_2023';

my $script_dir  = dirname(__FILE__);
my $uploads_dir = "$script_dir/../Online_Notepad/uploads";

unless (-d $uploads_dir) {
    mkdir $uploads_dir, 0777;
}

my $cgi = CGI->new();
my %cookies = CGI::Cookie->fetch();
my $cookie  = $cookies{$COOKIE_NAME};
my $is_auth = 0;
if ($cookie && $cookie->value() eq $SECRET_TOKEN) {
    $is_auth = 1;
}

my $action = $cgi->param('action');
$action = '' unless defined $action;

# --- action=list: No auth required (files are public) ---
if ($action eq 'list') {
    print $cgi->header(-type => 'application/json', -charset => 'UTF-8');
    opendir(my $dh, $uploads_dir) or do {
        print '{"files":[],"server":{}}';
        exit;
    };
    my @files = grep { -f "$uploads_dir/$_" && $_ !~ /^\./ } readdir($dh);
    closedir($dh);

    my @items;
    for my $f (sort @files) {
        my @stat = stat("$uploads_dir/$f");
        my $size = $stat[7];
        $size = 0 unless defined $size;
        push @items, sprintf('{"name":"%s","size":%d}', json_escape($f), $size);
    }

    my $srv = get_server_stats();

    print sprintf('{"files":[%s],"server":{"total_mem":"%s","free_mem":"%s","disk_total":"%s","disk_used":"%s","disk_free":"%s","disk_pct":%d,"os":"%s","hostname":"%s","uptime":"%s","perl_ver":"%s","cpu_info":"%s","load_avg":"%s","arch":"%s","processes":"%s"}}',
        join(',', @items),
        json_escape($srv->{total_mem}),
        json_escape($srv->{free_mem}),
        json_escape($srv->{disk_total}),
        json_escape($srv->{disk_used}),
        json_escape($srv->{disk_free}),
        $srv->{disk_pct} || 0,
        json_escape($srv->{os}),
        json_escape($srv->{hostname}),
        json_escape($srv->{uptime}),
        json_escape($srv->{perl_ver}),
        json_escape($srv->{cpu_info}),
        json_escape($srv->{load_avg}),
        json_escape($srv->{arch}),
        json_escape($srv->{processes})
    );
    exit;
}

# --- All other actions require auth ---
unless ($is_auth) {
    print $cgi->header(-type => 'application/json', -charset => 'UTF-8');
    print '{"error":"unauthorized"}';
    exit;
}

if ($action eq 'upload') {
    my $file_param = $cgi->param('file');
    unless ($file_param) {
        print $cgi->header(-type => 'application/json', -charset => 'UTF-8');
        print '{"error":"No file provided"}';
        exit;
    }

    # Get original filename and sanitize
    my $original_name = "$file_param";
    $original_name = basename($original_name);
    # Only remove truly dangerous filesystem characters, keep Unicode/CJK
    $original_name =~ s/[\/\\:\*\?"<>\|]/_/g;
    # Remove leading dots (hidden files)
    $original_name =~ s/^\.+//;
    $original_name = 'upload' unless length($original_name) > 0;

    # Avoid overwriting: append _1, _2, etc if file exists
    my $save_name = $original_name;
    if (-f "$uploads_dir/$save_name") {
        my ($base, $ext) = ($save_name, '');
        if ($save_name =~ /^(.+)(\.[^.]+)$/) {
            $base = $1;
            $ext  = $2;
        }
        my $counter = 1;
        while (-f "$uploads_dir/${base}_${counter}${ext}") {
            $counter++;
        }
        $save_name = "${base}_${counter}${ext}";
    }

    my $save_path = "$uploads_dir/$save_name";
    my $fh_upload = $cgi->upload('file');

    if ($fh_upload) {
        open(my $fw, '>', $save_path) or do {
            print $cgi->header(-type => 'application/json', -charset => 'UTF-8');
            print '{"error":"Cannot write file"}';
            exit;
        };
        binmode($fw);
        binmode($fh_upload);
        my $buf;
        while (read($fh_upload, $buf, 4096)) {
            print $fw $buf;
        }
        close($fw);
        chmod 0644, $save_path;

        my @stat = stat($save_path);
        my $size = $stat[7];
        $size = 0 unless defined $size;

        print $cgi->header(-type => 'application/json', -charset => 'UTF-8');
        print sprintf('{"success":1,"name":"%s","size":%d}', json_escape($save_name), $size);
    } else {
        # Fallback: try reading from param as filehandle
        my $fh_in = $cgi->param('file');
        if (ref($fh_in) || $fh_in) {
            open(my $fw, '>', $save_path) or do {
                print $cgi->header(-type => 'application/json', -charset => 'UTF-8');
                print '{"error":"Cannot write file"}';
                exit;
            };
            binmode($fw);
            my $buf;
            while (read($fh_in, $buf, 4096)) {
                print $fw $buf;
            }
            close($fw);
            chmod 0644, $save_path;

            my @stat = stat($save_path);
            my $size = $stat[7];
            $size = 0 unless defined $size;

            print $cgi->header(-type => 'application/json', -charset => 'UTF-8');
            print sprintf('{"success":1,"name":"%s","size":%d}', json_escape($save_name), $size);
        } else {
            print $cgi->header(-type => 'application/json', -charset => 'UTF-8');
            print '{"error":"Upload failed"}';
        }
    }
}
elsif ($action eq 'delete') {
    my $fn = $cgi->param('filename');
    $fn = '' unless defined $fn;

    if (is_safe_upload($fn) && -f "$uploads_dir/$fn") {
        unlink "$uploads_dir/$fn";
        print $cgi->header(-type => 'application/json', -charset => 'UTF-8');
        print '{"success":1}';
    } else {
        print $cgi->header(-type => 'application/json', -charset => 'UTF-8');
        print '{"error":"Delete failed"}';
    }
}
elsif ($action eq 'archive_list') {
    my $fn = $cgi->param('filename');
    $fn = '' unless defined $fn;

    print $cgi->header(-type => 'application/json', -charset => 'UTF-8');

    unless (is_safe_upload($fn) && -f "$uploads_dir/$fn") {
        print '{"error":"File not found"}';
        exit;
    }

    my $file_path = "$uploads_dir/$fn";
    my @entries;

    # Detect 7z binary
    my $bin_7z = `/usr/bin/which 7za 2>/dev/null` || `/usr/bin/which 7z 2>/dev/null` || `which 7za 2>/dev/null` || `which 7z 2>/dev/null`;
    chomp($bin_7z);
    $bin_7z = '7za' unless $bin_7z;

    # Try 7z/7za
    my $cmd_out = `$bin_7z l "$file_path" 2>/dev/null`;
    if ($cmd_out && $cmd_out =~ /Date\s+Time/i) {
        my @lines = split(/\n/, $cmd_out);
        my $in_list = 0;
        for my $line (@lines) {
            if ($line =~ /^-------------------/) {
                $in_list = !$in_list;
                next;
            }
            if ($in_list) {
                if ($line =~ /^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}\s+([\.\wD]+)\s+(\d+)\s+(?:\d+\s+)?(.+)$/) {
                    my $attr = $1;
                    my $size = $2;
                    my $name = $3;
                    $name =~ s/^\s+|\s+$//g;
                    my $is_dir = ($attr =~ /D/i || $name =~ /\/$/) ? 1 : 0;
                    push @entries, sprintf('{"name":"%s","size":%d,"is_dir":%d}', json_escape($name), $size, $is_dir);
                }
            }
        }
    }

    # Fallback for .zip: unzip -l
    if (!@entries && $fn =~ /\.zip$/i) {
        my $unzip_out = `unzip -l "$file_path" 2>/dev/null`;
        if ($unzip_out) {
            my @lines = split(/\n/, $unzip_out);
            for my $line (@lines) {
                if ($line =~ /^\s*(\d+)\s+\d{2}-\d{2}-\d{4}\s+\d{2}:\d{2}\s+(.+)$/) {
                    my $size = $1;
                    my $name = $2;
                    $name =~ s/^\s+|\s+$//g;
                    next if $name =~ /^----/;
                    my $is_dir = ($name =~ /\/$/) ? 1 : 0;
                    push @entries, sprintf('{"name":"%s","size":%d,"is_dir":%d}', json_escape($name), $size, $is_dir);
                }
            }
        }
    }

    # Fallback for .tar / .tar.gz / .tgz: tar tvf
    if (!@entries && $fn =~ /\.(tar|tar\.gz|tgz|gz)$/i) {
        my $tar_out = `tar tvf "$file_path" 2>/dev/null`;
        if ($tar_out) {
            my @lines = split(/\n/, $tar_out);
            for my $line (@lines) {
                if ($line =~ /^[-d][rwx-]+\s+.*\s+(\d+)\s+\w{3}\s+\d+\s+[\d:]+\s+(.+)$/) {
                    my $size = $1;
                    my $name = $2;
                    my $is_dir = ($line =~ /^d/) ? 1 : 0;
                    push @entries, sprintf('{"name":"%s","size":%d,"is_dir":%d}', json_escape($name), $size, $is_dir);
                }
            }
        }
    }

    print sprintf('{"success":1,"archive":"%s","entries":[%s]}', json_escape($fn), join(',', @entries));
    exit;
}
elsif ($action eq 'archive_extract') {
    my $fn = $cgi->param('filename');
    my $inner_path = $cgi->param('inner_path');
    $fn = '' unless defined $fn;
    $inner_path = '' unless defined $inner_path;

    unless (is_safe_upload($fn) && -f "$uploads_dir/$fn" && length($inner_path) > 0) {
        print $cgi->header(-type => 'text/plain', -status => '400 Bad Request');
        print 'Invalid request';
        exit;
    }

    $inner_path =~ s/\.\.//g;

    my $mime = 'application/octet-stream';
    if ($inner_path =~ /\.pdf$/i) { $mime = 'application/pdf'; }
    elsif ($inner_path =~ /\.png$/i) { $mime = 'image/png'; }
    elsif ($inner_path =~ /\.jpe?g$/i) { $mime = 'image/jpeg'; }
    elsif ($inner_path =~ /\.gif$/i) { $mime = 'image/gif'; }
    elsif ($inner_path =~ /\.webp$/i) { $mime = 'image/webp'; }
    elsif ($inner_path =~ /\.svg$/i) { $mime = 'image/svg+xml'; }
    elsif ($inner_path =~ /\.(txt|log|md)$/i) { $mime = 'text/plain; charset=UTF-8'; }
    elsif ($inner_path =~ /\.json$/i) { $mime = 'application/json'; }
    elsif ($inner_path =~ /\.html$/i) { $mime = 'text/html; charset=UTF-8'; }

    print $cgi->header(-type => $mime);

    my $file_path = "$uploads_dir/$fn";
    my $bin_7z = `/usr/bin/which 7za 2>/dev/null` || `/usr/bin/which 7z 2>/dev/null` || `which 7za 2>/dev/null` || `which 7z 2>/dev/null`;
    chomp($bin_7z);
    $bin_7z = '7za' unless $bin_7z;

    if ($fn =~ /\.7z$/i) {
        system($bin_7z, 'e', '-so', $file_path, $inner_path);
    } elsif ($fn =~ /\.zip$/i) {
        system('unzip', '-p', $file_path, $inner_path);
    } else {
        system($bin_7z, 'e', '-so', $file_path, $inner_path);
    }
    exit;
}
else {
    print $cgi->header(-type => 'application/json', -charset => 'UTF-8');
    print '{"error":"Invalid action"}';
}

sub is_safe_upload {
    my ($name) = @_;
    return 0 unless defined $name && length($name) > 0;
    return 0 if $name =~ m{[/\\]} || $name =~ /\.\./;
    return 0 if $name =~ /^\./;
    return 1;
}

sub get_server_stats {
    my $total_mem = 0;
    my $free_mem  = 0;
    my $disk_free = 0;

    # 1. Solaris 10 prtconf / sysdef with explicit path for total RAM
    my $prt = `/usr/sbin/prtconf 2>/dev/null` || `prtconf 2>/dev/null` || `/usr/sbin/sysdef 2>/dev/null` || `sysdef 2>/dev/null`;
    if ($prt && $prt =~ /Memory [Ss]ize:\s+(\d+)\s+(Megabytes|Gigabytes|MB|GB)/i) {
        my $val  = $1;
        my $unit = $2;
        if ($unit =~ /^G/i) {
            $total_mem = sprintf("%.1f GB", $val);
        } else {
            $total_mem = sprintf("%.1f GB", $val / 1024);
        }
    }

    # 2. Linux /proc/meminfo
    if (!$total_mem && -r '/proc/meminfo') {
        if (open(my $fh, '<', '/proc/meminfo')) {
            my ($total_kb, $avail_kb, $free_kb) = (0, 0, 0);
            while (<$fh>) {
                if (/MemTotal:\s+(\d+)\s+kB/i)     { $total_kb = $1; }
                if (/MemAvailable:\s+(\d+)\s+kB/i) { $avail_kb = $1; }
                if (/MemFree:\s+(\d+)\s+kB/i)      { $free_kb  = $1; }
            }
            close($fh);
            $total_mem = sprintf("%.1f GB", $total_kb / (1024 * 1024)) if $total_kb;
            my $free_val = $avail_kb ? $avail_kb : $free_kb;
            $free_mem  = sprintf("%.1f GB", $free_val / (1024 * 1024)) if $free_val;
        }
    }

    # 3. Solaris vmstat for free memory
    if (!$free_mem) {
        my $vm = `vmstat 1 2 2>/dev/null`;
        if ($vm) {
            my @lines = split(/\n/, $vm);
            if (@lines >= 3) {
                my $last = $lines[-1];
                $last =~ s/^\s+//;
                my @cols = split(/\s+/, $last);
                if (@cols >= 5 && $cols[4] =~ /^\d+$/) {
                    $free_mem = sprintf("%.1f GB", $cols[4] / (1024 * 1024));
                }
            }
        }
    }

    # 4. Disk space metrics
    my ($disk_total, $disk_used, $disk_free, $disk_pct) = ('N/A', 'N/A', 'N/A', 0);
    my $df = `df -k "$uploads_dir" 2>/dev/null`;
    if ($df) {
        my @lines = split(/\n/, $df);
        if (@lines >= 2) {
            my $line = $lines[-1];
            $line =~ s/^\s+//;
            my @cols = split(/\s+/, $line);
            my @nums = grep { /^\d+$/ } @cols;
            if (@nums >= 3) {
                my $total_kb = $nums[0];
                my $used_kb  = $nums[1];
                my $free_kb  = $nums[2];

                $disk_total = sprintf("%.1f TB", $total_kb / (1024 * 1024 * 1024));
                $disk_used  = sprintf("%.1f TB", $used_kb / (1024 * 1024 * 1024));
                if ($free_kb > 1024 * 1024) {
                    $disk_free = sprintf("%.1f GB", $free_kb / (1024 * 1024));
                } else {
                    $disk_free = sprintf("%.0f MB", $free_kb / 1024);
                }
                if ($total_kb > 0) {
                    $disk_pct = int(($used_kb / $total_kb) * 100);
                }
            }
        }
    }

    # 5. OS, Hostname, Uptime, Perl Version, CPU, Load Avg, Arch, Processes
    my $os_info = `uname -sr 2>/dev/null` || $^O;
    chomp($os_info);
    my $hostname = `hostname 2>/dev/null` || $ENV{SERVER_NAME} || 'JAIST Server';
    chomp($hostname);
    
    my $raw_uptime = `uptime 2>/dev/null` || 'N/A';
    chomp($raw_uptime);
    my $uptime = $raw_uptime;
    my $load_avg = 'N/A';
    
    if ($raw_uptime =~ /load averages?:\s*(.+)$/i) {
        $load_avg = $1;
        $load_avg =~ s/^\s+|\s+$//g;
    }
    
    if ($uptime =~ /up\s+(.+?),\s+\d+\s+users?/i) {
        $uptime = $1;
    } elsif ($uptime =~ /up\s+(.+?),/i) {
        $uptime = $1;
    }

    my $perl_ver = "Perl $]";
    if ($perl_ver =~ /5\.008009/) { $perl_ver = "Perl 5.8.9"; }
    elsif ($perl_ver =~ /5\.008004/) { $perl_ver = "Perl 5.8.4"; }
    elsif ($perl_ver =~ /5\.008/) { $perl_ver = "Perl 5.8"; }

    # CPU & Architecture
    my $arch = `uname -p 2>/dev/null` || `uname -m 2>/dev/null` || 'N/A';
    chomp($arch);
    my $isabits = `isainfo -b 2>/dev/null`;
    chomp($isabits) if $isabits;
    if ($isabits) {
        $arch .= " ($isabits-bit)";
    }

    my $cpu_count = 0;
    my $psr = `/usr/sbin/psrinfo 2>/dev/null` || `psrinfo 2>/dev/null`;
    if ($psr) {
        my @lines = split(/\n/, $psr);
        $cpu_count = scalar @lines;
    } elsif (-r '/proc/cpuinfo') {
        if (open(my $fh_cpu, '<', '/proc/cpuinfo')) {
            while (<$fh_cpu>) {
                $cpu_count++ if /^processor\s*:/i;
            }
            close($fh_cpu);
        }
    }

    my $cpu_info = $cpu_count > 0 ? "$cpu_count Cores" : 'N/A';
    if ($arch ne 'N/A') {
        $cpu_info .= " ($arch)";
    }

    # Running processes count
    my $proc_cnt = `ps -ef 2>/dev/null | wc -l`;
    chomp($proc_cnt);
    $proc_cnt =~ s/^\s+|\s+$//g;
    my $processes = ($proc_cnt =~ /^\d+$/ && $proc_cnt > 1) ? ($proc_cnt - 1) . " processes" : 'N/A';

    $total_mem = 'N/A' unless $total_mem;
    $free_mem  = 'N/A' unless $free_mem;

    return {
        total_mem  => $total_mem,
        free_mem   => $free_mem,
        disk_total => $disk_total,
        disk_used  => $disk_used,
        disk_free  => $disk_free,
        disk_pct   => $disk_pct,
        os         => $os_info,
        hostname   => $hostname,
        uptime     => $uptime,
        perl_ver   => $perl_ver,
        cpu_info   => $cpu_info,
        load_avg   => $load_avg,
        arch       => $arch,
        processes  => $processes
    };
}

sub json_escape {
    my ($str) = @_;
    $str = '' unless defined $str;
    $str =~ s/\\/\\\\/g;
    $str =~ s/"/\\"/g;
    $str =~ s/\n/\\n/g;
    $str =~ s/\r/\\r/g;
    $str =~ s/\t/\\t/g;
    return $str;
}
