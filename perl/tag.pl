#!/usr/bin/perl
use MP3::Tag;
use MP3::Info;
use POSIX;
use Encode;
use Encode::KR;
use Encode::Guess;
use utf8;
binmode(STDOUT, ":utf8");

my $mp3file = $ARGV[0];
my $imgfile = $ARGV[1];

my $mp3 = MP3::Tag->new($mp3file) or die "no file";
$mp3->get_tags;
my $id3v2 = $mp3->{ID3v2};

my $info = get_mp3info($mp3file);

print "{";
print "\"title\": \"", convert_text($mp3->title()), "\", ";
print "\"track\": ", convert_number($mp3->track1()), ", ";
print "\"disk\": ", convert_number($mp3->disk1()), ", ";
print "\"artist\": \"", convert_text($mp3->artist()), "\", ";
print "\"album\": \"", convert_text($mp3->album()), "\", ";
print "\"albumArtist\": \"", convert_text($id3v2->get_frame("TPE2")), "\", ";
print "\"year\": ", convert_number($mp3->year()), ", ";
print "\"genre\": \"", convert_text($mp3->genre()), "\", ";
print "\"time\": ", ceil($info->{SECS}), ", ";
print "\"bitrate\": ", $info->{BITRATE}, " ";
print "}";

#save_img($id3v2, $imgfile) if defined $imgfile;

$mp3->close();

sub convert_number {
	my $num = shift;

	return 0 if (!defined $num || $num eq "");
	return $num;
}

sub convert_text {
	my $text = shift;

	return "" if (!defined $text || $text eq "");

	my $enc = guess_encoding($text, qw/cp949 utf-8/);

	$text = decode($enc->name, $text) unless utf8::is_utf8($text);
	return $text;
}

sub save_img {
	my $id3v2 = shift;
	my $imgfile = shift;

	my $pic = $id3v2->get_frame("APIC");
	open (SAVE, ">$imgfile");
	binmode SAVE;
	print SAVE $pic->{_Data};
	close SAVE;
}
